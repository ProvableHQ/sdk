/**
 * Encrypted Record found on chain. This type provides the record ciphertext and metadata from the ledger such as the record's name, the program/function that produced it, etc.
 *
 * @property {string} commitment - The commitment of the record.
 * @property {string | undefined} checksum - The checksum of the record.
 * @property {number | undefined} block_height - The block height of the record.
 * @property {number | undefined} block_timestamp - The block timestamp of the record.
 * @property {string | undefined} program_name - The name of the program that produced the record.
 * @property {string | undefined} function_name - The name of the function that produced the record.
 * @property {number | undefined} output_index - The output index of the record.
 * @property {string | undefined} owner - The owner of the record.
 * @property {string | undefined} record_ciphertext - The ciphertext of the record.
 * @property {string | undefined} record_name - The name of the record.
 * @property {string | undefined} record_nonce - The nonce of the record.
 * @property {string | undefined} sender_ciphertext - The ciphertext of the sender.
 * @property {string | undefined} transaction_id - The ID of the transaction that produced the record.
 * @property {string | undefined} transition_id - The ID of the transition that produced the record.
 * @property {number | undefined} transaction_index - The index of the transaction that produced the record.
 * @property {number | undefined} transition_index - The index of the transition that produced the record.
 *
 * @example
 * const encryptedRecord: EncryptedRecord = {
 *     commitment: "1754131901135854615627743152473414463769543922079966020586765988138574911385field",
 *     checksum: "731623304764338277682996290553427512270277231686866672455141481050283829616field",
 *     block_height: 123456,
 *     block_timestamp: 1725845998,
 *     program_name: "credits.aleo",
 *     function_name: "transfer_private",
 *     output_index: 0,
 *     owner: "ciphertext1qgqdetlfzk98jkm4e7sgqml66e3x2gpg5d6udkpw0g67z0tplkpmzrm6q5dyfd7xhgmhedvptxzwfhrtxaqn7n0hs0esge3lwg9s2zukqgzxd0cr",
 *     record_ciphertext: "record1qyqsqt43u9kp97svljyyup3v4jmppd0vgght9edvvmtxx6mxycsej8cwqsrxzmt0w4h8ggcqqgqspf8zqut2ycnap7f0uzz5ktu0cxscca96urtkg2aweuzn70787dsrpp6x76m9de0kjezrqqpqyqp3mn3xeh53lukvcy406amjf5g0ksl3saauzjk0j4ljtjqq6kqlqhdz05sw92zye96qym7kp83ra0eesgtwhaw37c85r499456se8ts28m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgq4t2wr9tmcrfha5tfz5j585ptvvslqe0f6sf29vytshhdh7ym05rpqct4w35x7unf0fjkghm4de6xjmprqqpqzqru6p7fef29vuz6smyqwcn3z7jhxtdgjdw5xv23ppxhpgnvu72fp8hz6fjt6gsdn8yxhzq7gpsah0rscwqrzxwl5e8aemkj5gt09y7q5506yrf",
 *     record_name: "credits",
 *     record_nonce: "3077450429259593211617823051143573281856129402760267155982965992208217472983group",
 *     sender_ciphertext: "1754131901135854615627743152473414463769543922079966020586765988138574911385field",
 *     transaction_id: "at1f8ueqxu3x49sckpc6jlg676tmxumddzer3fwe2l0dxwj4dqxygyqua4u2q",
 *     transition_id: "au17mm5v7sfwus6y40xsyc99d5rtsr4vsajdec6twdjzv0m458q85zspqdnka",
 *     transaction_index: 0,
 *     transition_index: 0,
 * }
 */
export type EncryptedRecord = {
    commitment: string;
    checksum?: string;
    block_height?: number;
    block_timestamp?: number;
    program_name?: string;
    function_name?: string;
    output_index?: number;
    owner?: string;
    record_ciphertext?: string;
    record_name?: string;
    record_nonce?: string;
    sender_ciphertext?: string;
    transaction_id?: string;
    transition_id?: string;
    transaction_index?: number;
    transition_index?: number;
};
