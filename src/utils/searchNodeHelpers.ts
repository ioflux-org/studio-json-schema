type ExtractKeywords = (label: string) => string[];

export const extractKeywords: ExtractKeywords = (label) => {
    return label.toLowerCase().match(/[a-zA-Z0-9_]+/g) || [];
}
