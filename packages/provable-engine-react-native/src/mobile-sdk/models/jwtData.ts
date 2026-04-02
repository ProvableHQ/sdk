/**
 * Interface for the JWT data.
 *
 * @property jwt {string} The JWT token string.
 * @property expiration {number} The expiration time of the JWT token in UNIX timestamp format.
 */
export interface JWTData {
  jwt: string;
  expiration: number;
}
