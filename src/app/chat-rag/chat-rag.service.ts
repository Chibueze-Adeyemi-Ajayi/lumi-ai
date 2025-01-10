import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ChatCohere, CohereEmbeddings } from "@langchain/cohere";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
// import { log } from "console";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import axios from 'axios';
import { Chat } from '../chat/chat.schema/chat.schema';
import { promptTemplates, templates } from '../chat/chat.prompts/chat.prompt';

// import fs from "fs/promises";

const fs = require("fs")
const pdf = require("pdf-parse")

@Injectable()
export class ChatRagService {

    private logger = new Logger(ChatRagService.name)

    private async loadPdfsFromUrls(urls: string[]): Promise<any[]> {
        try {
            const promises = urls.map(async (url) => {
                try {

                    const response = await await axios.get(url, { responseType: 'arraybuffer' });

                    this.logger.debug(`loading ${url}`)

                    if (response.status !== 200) {
                        throw new HttpException({
                            message: `HTTP error! status: ${response.status} for URL: ${url}`
                        }, HttpStatus.FORBIDDEN);
                    }

                    const buffer = Buffer.from(response.data),
                        blob = new Blob([buffer], { type: "application/pdf" });;

                    const loader = new PDFLoader(blob);
                    const loaded = await loader.load();

                    return loaded;

                } catch (innerError) {
                    this.logger.error(`Error loading PDF from ${url}:`, innerError);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            // Flatten the results array to a single array of documents
            const final_document = results.flat();
            // this.logger.debug({final_document})
            return final_document;
        } catch (error) {
            console.error("Error loading PDFs:", error);
            return [];
        }
    }

    private loadDocs = async (paths: string[]) => {
        try {

            // let docs;

            // for (const path of paths) {

            //     const response = await axios.get(path, { responseType: 'arraybuffer' })

            //     if (response.status !== 200) throw new HttpException({ message: "Error loading document" }, HttpStatus.FORBIDDEN)

            //     const buffer = Buffer.from(response.data),
            //         blob = new Blob([buffer], { type: "application/pdf" });;

            //     const loader = new PDFLoader(blob);
            //     const loaded = await loader.load();

            //     log(loaded)

            //     docs = loaded

            //     this.logger.debug({ docs })

            // }

            return await this.loadPdfsFromUrls(paths);

        } catch (error: any) {
            this.logger.error("Loading Document Error: ", error)
        }
    }

    private vectorize = async (docs: any) => {
        try {

            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const splits = await textSplitter.splitDocuments(docs);
            const vectorStore = await MemoryVectorStore.fromDocuments(splits, new CohereEmbeddings({ apiKey: process.env.COHERE_API_KEY, model: "embed-english-v3.0" }));
            const retriever = vectorStore.asRetriever();

            return retriever
        } catch (error: any) {
            this.logger.error("Vectorizing Error: ", error)
        }
    }

    private chain_rag = async (llm, retriever: any) => {
        try {
            // const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
            const prompt = new PromptTemplate({
                inputVariables: ["context", "question"],
                // partialVariables: {"format_instructions": parser.get_format_instructions()},
                template: `# Your role\nYou are a brilliant project research assistant called Lumi by Jilo Innovations that 
                understanding the intent of the questioner and the 
                crux of the question, and providing the most optimal answer to the questioner's needs from the documents
                you are given.\n\n\n
                You have an agent who has done the processing before. it is delimited by XML tags, in the Question - use 
                it as a guide in crafting your response.
                The conversation history is delimited by XML tags, in the Question - use it as a guide in crafting your 
                response.

                # Instruction\n
                Your task is to answer the question using the following pieces of retrieved context delimited by XML tags.\n\n
                The retrieved context is a document uploaded by the user prompting the model\n\n
                <retrieved context>\nRetrieved Context:\n{context}\n</retrieved context>\n\n\n

                #Attention\n
                Ensure your response is comprehensive enough as you are a technical report writing assistant.\n\n
                Your response must be plain text alone, and must address each and every need of the question asked following university education standard.\n\n
                When responding, if the history is empty include greetings otherwise go straight to the elaborate and comprehensive point.\n\n
                This means do not include responses like 'certainly!, I am ready to', when the history is not empty just go straight to your answer.\n\n

                # Constraint\n
                1. Think deeply and multiple times about the user's question\\nUser's question:\\n{question}\\nYou must 
                understand the intent of their question and provide the most appropriate answer.\n- Ask yourself why to 
                understand the context of the question and why the questioner asked it, reflect on it, and provide an 
                appropriate response based on what you understand.\n
                2. Choose the most relevant content(the key content that directly relates to the question) from the 
                retrieved context and use it to generate an answer.\n
                3. Generate a concise, logical answer. When generating the answer, Do Not just list your selections, 
                But rearrange them in context so that they become paragraphs with a natural flow. \n
                5. Do not say things like 'am glad to' or anything of its kind, go straight to the answer from your context\n

                # Question:\n{question}

                #Tone\n
                Ensure you respond in an educationally professional manner`
            })

            const ragChain = RunnableSequence.from([
                {
                    context: retriever.pipe(formatDocumentsAsString),
                    question: new RunnablePassthrough(),
                },
                prompt,
                llm,
                new StringOutputParser(),
            ]);

            return ragChain
        } catch (error: any) {
            this.logger.error("Chain Error: ", error)
            return null
        }
    }

    public getChain = async (llm: ChatCohere, paths: string[]) => {
        let docs = await this.loadDocs(paths)
        this.logger.warn("DOCS LOADING")
        let vector = await this.vectorize(docs)
        this.logger.warn("VECTORIZING")
        let chain = await this.chain_rag(llm, vector)
        this.logger.warn("CREATING CHAIN")
        return chain
    }

    async raw_docs(chat: Chat) {
        let documents = chat.documents;
        try {
            const promises = documents.map(async (url) => {
                try {

                    const response = await await axios.get(url, { responseType: 'arraybuffer' });

                    this.logger.debug(`loading ${url}`)

                    if (response.status !== 200) {
                        throw new HttpException({
                            message: `HTTP error! status: ${response.status} for URL: ${url}`
                        }, HttpStatus.FORBIDDEN);
                    }

                    const buffer = Buffer.from(response.data);
                    let docs = await pdf(buffer);

                    return docs;

                } catch (innerError) {
                    this.logger.error(`Error loading PDF from ${url}:`, innerError);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            // Flatten the results array to a single array of documents
            const final_document = results.flat();
            // this.logger.debug({final_document})
            return final_document;
        } catch (error) {
            console.error("Error loading PDFs:", error);
            return [];
        }
    }

    public invoke = async (query: string, chain: RunnableSequence) => {
        return await chain.invoke(query)
    }

    public async allTemplates() {
        return templates
    }

}
