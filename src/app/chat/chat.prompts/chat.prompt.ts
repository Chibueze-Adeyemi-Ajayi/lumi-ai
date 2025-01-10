export const templates = [
    "literature-review"
]

export const promptTemplates = {
    "literature-review": [
        {
            name: "Template 1",
            id: "f25a1454-991d-4f68-8a03-63271b75adff",
            steps: [
                {
                    name: "Introduction",
                    length: 5000,
                    prompt: `From the document you are to write the introduction for a university academic literature review\n
                             The introduction section is a concise definition of the topic (this may be a descriptive or argumentative thesis, or
                             proposal), as well as the scope of the related literature being investigated.\n
                             The introduction should also note intentional exclusions.\n
                             Primarily, the purpose of the introduction is to state the general findings of the review (what do most of the
                             sources conclude), and comment on the availability of sources in the subject area.`
                },
                {
                    name: "Main-Body",
                    length: 10000,
                    prompt: `From the document you are to write the main body alone of a university academic literature review\n
                             You have a choice to use either a chronological or thematic approach to organize the evaluations of the dcument\n
                             Each work should be critically summarized and evaluated for its premise, methodology, and conclusion.
                             It is as important to address inconsistencies, omissions, and errors, as it is to identify accuracy, depth, and
                             relevance\n
                             Use logical connections and transitions to connect sources\n
                             Do not include conclusion in this. Your only objective is to generate the body of this academic literature review`
                },
                {
                    name: "Conclusion",
                    length: 2500,
                    prompt: `From the document you are to write just the conclusion of a university academic literature review alone\n
                             The conclusion summarizes the key findings of the review in general terms. Notable commonalities
                             between works, whether favourable or not, may be included here.\n
                             This section is the reviewer's opportunity to justify a research proposal. Therefore, the idea should be
                             clearly re-stated and supported according to the findings of the review`
                },
                {
                    name: "References",
                    length: 100,
                    prompt: `From the document you are to write just the reference of a university academic literature review alone\n
                             It must include accurate in-text citations, this literature review must contain complete and correct citations for every source.`
                },
            ]
        }
    ]
}