import { Router } from "express";
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Blocks
 *     description: Operations related to blocks
 *  
 */

/**
 * @swagger
 * /latest/block:
 *   get:
 *     tags: [Blocks]
 *     summary: Get latest block
 *     description: Retrieve latest block
 *     responses:
 *       200:
 *         description: A block object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/latest/block", async (req, res) => {
    try {
        const block = await fetchData(`/latest/block`);
        res.json(block);
    } catch (error) {
        res.status(500).json({ message: "Error fetching latest block" });
    }
});

/**
 * @swagger
 * /latest/height:
 *   get:
 *     tags: [Blocks]
 *     summary: Get latest block height
 *     description: Retrieve latest block height
 *     responses:
 *       200:
 *         description: A block height object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/latest/height", async (req, res) => {
    try {
        const block = await fetchData(`/latest/height`);
        res.json(block);
    } catch (error) {
        res.status(500).json({ message: "Error fetching latest block height" });
    }
});

/**
 * @swagger
 * /latest/hash:
 *   get:
 *     tags: [Blocks]
 *     summary: Get latest hash
 *     description: Retrieve latest hash
 *     responses:
 *       200:
 *         description: A hash object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */

router.get("/latest/hash", async (req, res) => {
    try {
        const block = await fetchData(`/latest/hash`);
        res.json(block);
    } catch (error) {
        res.status(500).json({ message: "Error fetching latest hash" });
    }
});

/**
 * @swagger
 * /latest/stateRoot:
 *   get:
 *     tags: [Blocks]
 *     summary: Get latest stateroot
 *     description: Retrieve latest stateroot
 *     responses:
 *       200:
 *         description: A stateroot object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/latest/stateroot", async (req, res) => {
    try {
        const block = await fetchData(`/latest/stateroot`);
        res.json(block);
    } catch (error) {
        res.status(500).json({ message: "Error fetching latest stateroot" });
    }
});

/**
 * @swagger
 * /latest/committee:
 *   get:
 *     tags: [Blocks]
 *     summary: Get latest committee
 *     description: Retrieve latest committee
 *     responses:
 *       200:
 *         description: A committee object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
router.get("/latest/committee", async (req, res) => {
    try {
        const block = await fetchData(`/latest/committee`);
        res.json(block);
    } catch (error) {
        res.status(500).json({ message: "Error fetching latest committee" });
    }
});

export default router;
