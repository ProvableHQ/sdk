import { Router } from "express";
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: Operations related to transactions
 *  
 */

/**
 * @swagger
 * /transaction/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by ID
 *     description: Retrieve transaction by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the transaction to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A transaction object
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/transaction/:id", async (req, res) => {
    const  id  = req.params;
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/transaction/${id}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction:", error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status).json({ message: error.response.data.message || "Error fetching transaction" });
        } else if (error.request) {
            // No response was received
            return res.status(500).json({ message: "No response received from the API" });
        } else {
            // Other errors (like setup errors)
            return res.status(500).json({ message: error.message });
        }
    }
});


/**
 * @swagger
 * /transaction/confirmed/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by ID
 *     description: Retrieve transaction by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the transaction to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A transaction object
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/transaction/confirmed/:id", async (req, res) => {
    const  id  = req.params;
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/transaction/confirmed/${id}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction:", error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status).json({ message: error.response.data.message || "Error fetching transaction" });
        } else if (error.request) {
            // No response was received
            return res.status(500).json({ message: "No response received from the API" });
        } else {
            // Other errors (like setup errors)
            return res.status(500).json({ message: error.message });
        }
    }
});

/**
 * @swagger
 * /transaction/broadcast:
 *   post:
 *     tags: [Transactions]
 *     summary: Broadcast transaction to the network
 *     description: Broadcast a transaction to the network.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: transaction
 *         description: The serialized transaction.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             transaction:
 *               type: string
 *               description: The transaction data to broadcast.
 *     responses:
 *       200:
 *         description: A boolean indicating success or failure
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/transaction/broadcast", async (req, res) => {
    try {
        // Post transaction broadcast from the external API
        const transaction = await fetchData(`/transaction/broadcast`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error broadcasting transaction:", error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status).json({ message: error.response.data.message || "Error fetching transaction" });
        } else if (error.request) {
            // No response was received
            return res.status(500).json({ message: "No response received from the API" });
        } else {
            // Other errors (like setup errors)
            return res.status(500).json({ message: error.message });
        }
    }
});

/**
 * @swagger
 * /block/{height}/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by block height
 *     description: Retrieve transaction by block height
 *     parameters:
 *       - name: height
 *         in: path
 *         required: true
 *         description: block height s
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: An array of transactions in the block
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/block/:height/transactions", async (req, res) => {
    const  height  = req.params;
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/block/${height}/transactions`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction:", error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status).json({ message: error.response.data.message || "Error fetching transaction" });
        } else if (error.request) {
            // No response was received
            return res.status(500).json({ message: "No response received from the API" });
        } else {
            // Other errors (like setup errors)
            return res.status(500).json({ message: error.message });
        }
    }
});

/**
 * @swagger
 * /memoryPool/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Memory Pool Transactions
 *     description: Return transactions in the memory pool
 *     responses:
 *       200:
 *         description: An array of transactions
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/memoryPool/transactions", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/memoryPool/transactions`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction:", error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status).json({ message: error.response.data.message || "Error fetching transaction" });
        } else if (error.request) {
            // No response was received
            return res.status(500).json({ message: "No response received from the API" });
        } else {
            // Other errors (like setup errors)
            return res.status(500).json({ message: error.message });
        }
    }
});

/**
 * @swagger
 * /statePath/commitment:
 *   get:
 *     tags: [Transactions]
 *     summary: Get state path for commitment
 *     description: Returns state path for the given commitment. The state path proves existence of the transition leaf to either a global or local state root.
 *     responses:
 *       200:
 *         description: State path 
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/statePath/:commitment", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/statePath/${commitment}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction:", error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status).json({ message: error.response.data.message || "Error fetching transaction" });
        } else if (error.request) {
            // No response was received
            return res.status(500).json({ message: "No response received from the API" });
        } else {
            // Other errors (like setup errors)
            return res.status(500).json({ message: error.message });
        }
    }
});






export default router;