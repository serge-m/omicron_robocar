const express = require('express')
const expressWS = require('express-ws') 
const path = require('path')
const app = express()
const appWS = expressWS(app)
const port = 3000

app.get('/', (request, response) => {
  response.send('Hello from Express!')
})

app.use('/static', express.static(path.join(__dirname, 'static')))

app.ws('/', (s, req) => {
  console.error('websocket connection');
  for (var t = 0; t < 3; t++)
    setTimeout(() => s.send('message from server', ()=>{}), 1000*t);
});


app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

