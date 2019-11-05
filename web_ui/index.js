const express = require('express')
const path = require('path')
const app = express()
const port = 9555

app.get('/', (request, response) => {
  response.send('Hello from Express!')
})

app.use('/static', express.static(path.join(__dirname, 'static')))

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
