export interface KeySearchParams {
  [key: string]: any; // This allows for arbitrary keys with any type values
}

/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
export class AleoKeyProviderParams implements KeySearchParams {
  name: string | undefined;
  proverUri: string | undefined;
  verifierUri: string | undefined;
  cacheKey: string | undefined;

  /**
   * Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
   * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
   * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
   * be provided.
   *
   * @param { AleoKeyProviderInitParams } params - Optional search parameters
   */
  constructor(params: {
    proverUri?: string;
    verifierUri?: string;
    cacheKey?: string;
    name?: string;
  }) {
    this.proverUri = params.proverUri;
    this.verifierUri = params.verifierUri;
    this.cacheKey = params.cacheKey;
    this.name = params.name;
  }
}
