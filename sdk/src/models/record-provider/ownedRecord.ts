/**
 * Record owned by a registered view key. This type provides the record ciphertext, record plaintext and metadata from the ledger such as the record's name, the program/function that produced it, etc.
 *
 * @property {number | undefined} block_height - Block height where the record was created.
 * @property {number | undefined} block_timestamp - The timestamp of the block that the record was created in.
 * @property {string | undefined} commitment - Commitment of the record.
 * @property {string | undefined} function_name - Name of the function that created the record.
 * @property {number | undefined} output_index - Index of the output in the function call that created the record.
 * @property {string | undefined} owner - Address of the record owner.
 * @property {string | undefined} program_name - Name of the program that created the record.
 * @property {string | undefined} record_ciphertext - Encrypted ciphertext of the record.
 * @property {string | undefined} record_name - Name of the record.
 * @property {string | undefined} sender - Address of the sender.
 * @property {boolean | undefined} spent - Whether the record has been spent.
 * @property {string | undefined} tag - Tag associated with the record.
 * @property {string | undefined} transaction_id - ID of the transaction that created the record.
 * @property {string | undefined} transition_id - ID of the transition that created the record.
 * @property {string | undefined} transaction_index - Index of the transaction in the block.
 * @property {string | undefined} transition_index - Index of the transition in the transaction.
 *
 * @example
 * const ownedRecord: OwnedRecord = {
 *     block_height: 123456,
 *     block_timestamp: 1725845998,
 *     commitment: "1754131901135854615627743152473414463769543922079966020586765988138574911385field",
 *     function_name: "transfer_public_to_private",
 *     output_index: 0,
 *     owner: "ciphertext1qgqdetlfzk98jkm4e7sgqml66e3x2gpg5d6udkpw0g67z0tplkpmzrm6q5dyfd7xhgmhedvptxzwfhrtxaqn7n0hs0esge3lwg9s2zukqgzxd0cr",
 *     program_name: "credits.aleo",
 *     record_ciphertext: "record1qyqsqt43u9kp97svljyyup3v4jmppd0vgght9edvvmtxx6mxycsej8cwqsrxzmt0w4h8ggcqqgqspf8zqut2ycnap7f0uzz5ktu0cxscca96urtkg2aweuzn70787dsrpp6x76m9de0kjezrqqpqyqp3mn3xeh53lukvcy406amjf5g0ksl3saauzjk0j4ljtjqq6kqlqhdz05sw92zye96qym7kp83ra0eesgtwhaw37c85r499456se8ts28m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgq4t2wr9tmcrfha5tfz5j585ptvvslqe0f6sf29vytshhdh7ym05rpqct4w35x7unf0fjkghm4de6xjmprqqpqzqru6p7fef29vuz6smyqwcn3z7jhxtdgjdw5xv23ppxhpgnvu72fp8hz6fjt6gsdn8yxhzq7gpsah0rscwqrzxwl5e8aemkj5gt09y7q5506yrf",
 *     record_plaintext: "{ owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private, microcredits: 1500000000000000u64.private, _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public , _version: 1u8 }",
 *     record_name: "credits",
 *     spent: true,
 *     sender: "aleo1sf5kk4f8mcmgjasw9fannmm0h8z2nwqxu5e200cjneu28jxvtvpqulfxsa",
 *     tag: "6511661650536816422260305447175136877451468301541296257226129781611237851030field",
 *     transaction_id: "at1f8ueqxu3x49sckpc6jlg676tmxumddzer3fwe2l0dxwj4dqxygyqua4u2q",
 *     transition_id: "au17mm5v7sfwus6y40xsyc99d5rtsr4vsajdec6twdjzv0m458q85zspqdnka",
 *     transaction_index: 0,
 *     transition_index: 0,
 * }
 */
export type OwnedRecord = {
    block_height?: number;
    block_timestamp?: number;
    commitment?: string;
    function_name?: string;
    output_index?: number;
    owner?: string;
    program_name?: string;
    record_ciphertext?: string;
    record_plaintext?: string;
    record_name?: string;
    sender?: string;
    spent?: boolean;
    tag?: string;
    transaction_id?: string;
    transition_id?: string;
    transaction_index?: number;
    transition_index?: number;
};
