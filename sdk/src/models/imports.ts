interface ImportedVerifyingKeys {
    [key: string]: Array<[string, string]>;
}

interface ImportedPrograms {
    [key: string]: string; // This allows for arbitrary keys with any type values
}

export { ImportedVerifyingKeys, ImportedPrograms }
