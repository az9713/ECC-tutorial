import express from 'express'
import dotenv from 'dotenv'
import apiRouter from './routes/api'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT ?? '3000')

app.use(express.json())
app.use('/api', apiRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
