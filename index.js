const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.m4sihj5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized user' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            return res.status(401).send({ message: 'Unauthorized user' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('GeniusCar').collection('services')
        const orderCollection = client.db('GeniusCar').collection('orders')

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            // console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
            console.log(token);
        })


        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service)
        });

        app.get('/orders', verifyJwt, async (req, res) => {

            const decoded = req.decoded;
            console.log("Inside order api", decoded);
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'Forbidden User' })
            }


            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        app.post('/orders', verifyJwt, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result);
        });

        app.delete('/orders/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })

        app.patch('/orders/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const status = req.body.params;
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: status,
                }
            }

            const result = await orderCollection.updateOne(query, updateDoc);
            res.send(result);
        })


    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Genius car service is working successfully');

})

app.listen(port, () => {
    console.log(`Genius car service is running on port ${port}`);
})