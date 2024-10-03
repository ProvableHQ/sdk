import { Router } from "express";
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Programs
 *     description: Operations related to programs
 *  
 */

/**
 * @swagger
 * /program/{programId}:
 *   get:
 *     tags: [Programs]
 *     summary: Get a specific program
 *     description: Retrieve program details by program ID.
 *     parameters:
 *       - name: programId
 *         in: path
 *         required: true
 *         description: ID of the program to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A program object
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
router.get("/program/:programId", async (req, res) => {
    const programId = req.params.programId;
    try {
        const program = await fetchData(`/program/${programId}`);
        res.json(program);
    } catch (error) {
        res.status(500).json({ message: "Error fetching program" });
    }
});

// Endpoint to get mappings for a specific program
/**
 * @swagger
 * /program/{programId}/mappings:
 *   get:
 *     tags: [Programs]
 *     summary: Get mappings for a specific program
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         description: The ID of the program to retrieve mappings for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response with mappings details
 *       404:
 *         description: Program not found
 */
router.get("/program/:programId/mappings", async (req, res) => {
    const { programId } = req.params;
    try {
        const response = await axios.get(
            `${BASE_URL}/program/${programId}/mappings`
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching mappings:", error);
        res.status(404).json({
            message: "Mappings not found for this program",
        });
    }
});

// Endpoint to get mapping value for a specific program, mapping, and key
/**
 * @swagger
 * /program/{programId}/mapping/{name}/{key}:
 *   get:
 *     tags: [Programs]
 *     summary: Get mappings for a specific program
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         description: The ID of the program to retrieve mappings for
 *         schema:
 *           type: string
 *       - in: path
 *         name: name
 *         required: true
 *         description: The name of the mapping 
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         description: The key of the mapping 
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response with mappings details
 *       404:
 *         description: Program not found
 */
router.get("/program/:programId/mapping/:name/:key", async (req, res) => {
    const { programId, name, key } = req.params;
    try {
        const response = await axios.get(
            `${BASE_URL}/program/${programId}/mapping/${name}/${key}`
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching mapping value:", error);
        res.status(404).json({
            message: "Mapping value not found for this program",
        });
    }
});

export default router;
