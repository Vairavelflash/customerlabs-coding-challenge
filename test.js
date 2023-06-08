const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const connection = require('./db'); 


const app = express();
app.use(cors()); 
app.use(bodyParser.json());

let accounts = [];

// Generate a unique account ID
function generateAccountId() {
  return Date.now().toString(36);
}

function generateAlphanumString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}



app.post('/accounts',(req,res) => {
  const { email, accountName, website } = req.body;
  if (!email || !accountName) {
    return res.status(400).json({ error: 'Email and account name are required fields.' });
  }
  var sql = "INSERT INTO Account (emailid,accountname,website,accountid,appsecrettoken) VALUES (?,?,?,?,?)";
  let account = [email,accountName,website,generateAccountId(),generateAlphanumString(38)]
  connection.query(sql,account, function (err, result) {
    if (err) throw err;
    res.json('record inserted')
    console.log("1 record inserted");
  });
})

// Get all accounts
app.get('/accounts', (req, res) => {
  connection.query('SELECT * FROM Account', (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

// Get an account by ID
app.get('/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  let sql = `SELECT * FROM Account WHERE accountid= '${accountId}'`
  connection.query(sql, function (err, result) {
    if (err) throw err;
    res.json(result)
  });

});


// Delete an account
app.delete('/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  let sql = `DELETE Account, Destination 
  FROM Account INNER JOIN Destination  
  ON Account.accountid = Destination.accountid
  WHERE Account.accountid= '${accountId}'
  `;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    res.json("DELETED")
  });
});

// -----------------------------------------------------------------------------------------

app.post('/accounts/:accountId/destinations', (req, res) => {
    const { accountId } = req.params;
    const { url, method, headers } = req.body;
    
  
    var sql = "INSERT INTO Destination (url,httpmethod,headers,accountid) VALUES (?,?,?,?)";
    let destination = [url,method,headers,accountId]
    connection.query(sql,destination, function (err, result) {
      if (err) throw err;
      res.json('record inserted')
      console.log("record inserted");
    });
  });
  
  // Get all destinations for an account
  app.get('/accounts/:accountId/destinations', (req, res) => {
    const { accountId } = req.params;
   
    let sql = `SELECT * FROM Destination WHERE accountid= '${accountId}'`
    connection.query(sql, function (err, result) {
      if (err) throw err;
      res.json(result)
    });
  });
  
  // Delete all destinations for an account
  app.delete('/accounts/:accountId/destinations', (req, res) => {
    const { accountId } = req.params;
    let sql = `DELETE FROM Destination WHERE accountid= '${accountId}'`;
    connection.query(sql, function (err, result) {
      if (err) throw err;
      res.json("DELETED")
    });
  });

//   -------------------------------------------------------------------------------------


app.post('/server/incoming_data', (req, res) => {
    const { body } = req;
    const appSecretToken = body['cl-x-token'];
    if (!appSecretToken) {
      return res.json({ error: 'Unauthorized. App secret token is missing.' });
    }


  let accountsid;
    let sql = `SELECT accountid FROM Account where appsecrettoken='${appSecretToken}'`
  connection.query(sql, function (err, result) {
    if (err) throw err;
    // res.json(result)
    accountsid = result[0].accountid;
    
    console.log(accountsid)
    if(req.body.method === 'GET'){
        if (typeof body !== 'object') {
                return res.status(400).json({ error: 'Invalid Data' });
              }
              let sql = `SELECT url,httpmethod,headers FROM Destination WHERE accountid= '${accountsid}'`
                 connection.query(sql, function (err, result) {
                 if (err) throw err;
                 getDatafromDestinations(result)
                 res.json('Data get')
                });

    }
    else if (req.body.method === 'POST' || req.body.method === 'PUT'){
        if (typeof body !== 'object') {
            return res.status(400).json({ error: 'Invalid Data' });
          }
          let sql = `SELECT url,httpmethod,headers FROM Destination WHERE accountid= '${accountsid}'`
          connection.query(sql, function (err, result) {
          if (err) throw err;
          sendDataToDestinations(result)
          res.json('Data sent')
         });
    }
    

    // res.json(result)
  });
  

  });
  
  async function sendDataToDestinations(destinations) {
    try {
        const requests = destinations.map(async (destination) => {
          const { url, httpmethod, headers, data } = destination;
          console.log(url,httpmethod,headers)
          
          const response = await axios({
            url,
            method : httpmethod,
            headers,
            data,
          });
          console.log(`Data sent to ${url}. Response: ${response.data}`);
        });
    
        await Promise.all(requests);
        console.log('All requests completed successfully.');
      } catch (error) {
        console.error('An error occurred during the requests:', error);
      }
    }

    async function getDatafromDestinations(destinations) {
              const requests = destinations.map((destination) => {
                const { url, httpmethod, headers } = destination;
                console.log(url,httpmethod,headers)
                axios.get(`${url}`,{headers:{headers}})
              })
              .then(function (response) {
                console.log(response.data);
            })
            .catch(function (error) {
                console.error(error);
            });
            }


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
