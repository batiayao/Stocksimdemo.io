const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Load or initialize users
let users = fs.existsSync('users.json') ? JSON.parse(fs.readFileSync('users.json')) : {};

// Signup
app.post('/signup',(req,res)=>{
  const {name,email,password,plan} = req.body;
  if(users[email]) return res.status(400).json({message:'User exists'});
  users[email] = {
    name, email, password, plan,
    portfolios: { 'Default': {balance:10000, stocks:{}} },
    currentPortfolio: 'Default'
  };
  fs.writeFileSync('users.json',JSON.stringify(users,null,2));
  res.json({message:'Signup successful'});
});

// Login
app.post('/login',(req,res)=>{
  const {email,password} = req.body;
  if(!users[email] || users[email].password!==password) return res.status(400).json({message:'Invalid credentials'});
  res.json(users[email]);
});

// Trade endpoint
app.post('/trade',(req,res)=>{
  const {email,stock,type,shares,price} = req.body;
  const user = users[email];
  if(!user) return res.status(400).json({message:'User not found'});

  const portfolio = user.portfolios[user.currentPortfolio];
  if(!portfolio.stocks[stock]) portfolio.stocks[stock]=0;
  const total = shares*price;

  if(type==='buy'){
    if(portfolio.balance<total) return res.status(400).json({message:'Not enough balance'});
    portfolio.balance-=total;
    portfolio.stocks[stock]+=shares;
  } else if(type==='sell'){
    if(portfolio.stocks[stock]<shares) return res.status(400).json({message:'Not enough shares'});
    portfolio.balance+=total;
    portfolio.stocks[stock]-=shares;
  }

  fs.writeFileSync('users.json',JSON.stringify(users,null,2));
  res.json(user);
});

// Switch portfolio
app.post('/switchPortfolio',(req,res)=>{
  const {email,portfolioName} = req.body;
  const user = users[email];
  if(!user) return res.status(400).json({message:'User not found'});
  if(!user.portfolios[portfolioName]){
    user.portfolios[portfolioName]={balance:10000, stocks:{}};
  }
  user.currentPortfolio = portfolioName;
  fs.writeFileSync('users.json',JSON.stringify(users,null,2));
  res.json(user);
});

// Leaderboard
app.get('/leaderboard',(req,res)=>{
  const leaderboard = Object.values(users).map(u=>{
    const p = u.portfolios[u.currentPortfolio];
    let total = p.balance;
    for(let s in p.stocks){
      total += p.stocks[s]*stockPrices[s] || 0;
    }
    return {name:u.name,value:total.toFixed(2)};
  }).sort((a,b)=>b.value-a.value).slice(0,10);
  res.json(leaderboard);
});

// Store live stock prices
let stockPrices = {};
app.post('/updatePrices',(req,res)=>{
  stockPrices = req.body;
  res.json({message:'Prices updated'});
});

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
