import { Router } from "express";
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Network
 *     description: Operations related to network 
 *  
 */

/**
 * @swagger
 * /peers/count:
 *   get:
 *     tags: [Network]
 *     summary: Returns number of peers connected to the node. 
 *     responses:
 *       200:
 *         description: Number of peers connected to the node 
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/peers/count", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/peers/count`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching peer count:", error);
        
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
 * /peers/all:
 *   get:
 *     tags: [Network]
 *     summary: Returns peers connected to the node. 
 *     responses:
 *       200:
 *         description: Peers connected to the node 
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/peers/all", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/peers/all`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching peers:", error);
        
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
 * /peers/all/metrics:
 *   get:
 *     tags: [Network]
 *     summary: Returns peers connected to the node and their types. 
 *     responses:
 *       200:
 *         description: Peers connected to the node 
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/peers/all/metrics", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/peers/all/metrics`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching peers:", error);
        
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
 * /node/address:
 *   get:
 *     tags: [Network]
 *     summary: Returns the address of the node.  
 *     responses:
 *       200:
 *         description: The address of the node. 
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/node/address", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/peers/all/metrics`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching peers:", error);
        
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
 * /find/blockhash/{transactionID}:
 *   get:
 *     tags: [Network]
 *     summary: Returns the block hash of the block containing the given transaction ID.
 *     responses:
 *       200:
 *         description: The address of the node. 
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/find/blockHash/:transactionID", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/find/blockHash/${transactionID}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching block hash:", error);
        
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
 * /find/transactionID/deployment/{programID}:
 *   get:
 *     tags: [Network]
 *     summary: Returns the transaction ID of the transaction containing the given program ID.
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         description: The ID of the program to retrieve transaction ID for
 *         schema:
 *           type: string 
 *     responses:
 *       200:
 *         description: The transaction ID
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/find/transactionID/deployment/:programID", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/find/transactionID/deployment/${programID}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction ID:", error);
        
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
 * /find/transactionID/{transitionID}:
 *   get:
 *     tags: [Network]
 *     summary: Find Transaction ID From Transition ID
 *     parameters:
 *       - in: path
 *         name: transitionID
 *         required: true
 *         description: The transition ID
 *         schema:
 *           type: string 
 *     responses:
 *       200:
 *         description: The transaction ID
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/find/transactionID/:transitionID", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/find/transactionID/${transitionID}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction ID:", error);
        
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
 * /find/transitionID/{inputOrOutputID}:
 *   get:
 *     tags: [Network]
 *     summary: Returns the transition ID of the transition corresponding to the ID of the input or output.
 *     parameters:
 *       - in: path
 *         name: inputOrOutputID
 *         required: true
 *         description: Input or output ID
 *         schema:
 *           type: string 
 *     responses:
 *       200:
 *         description: The transaction ID
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/find/transactionID/:inputOrOutputID", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/find/transactionID/${inputOrOutputID}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction ID:", error);
        
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
 * /node/env:
 *   get:
 *     tags: [Network]
 *     summary: Returns the environment info of the node. The snarkOS command line arguments to start the node as well as the GitHub branch and commit hash.
 *     responses:
 *       200:
 *         description: The environment info of the node
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/node/envD", async (req, res) => {
    try {
        // Fetch transaction details from the external API
        const transaction = await fetchData(`/find/transactionID/${inputOrOutputID}`);
        res.json(transaction); // Send the transaction details as a response
    } catch (error) {
        console.error("Error fetching transaction ID:", error);
        
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

