const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');

const app = express();
app.use(bodyParser.json());


// Looking up env variable PORT in case 8000 is taken

const port = process.env.PORT || 8000;
app.listen('8000', ()=>console.log(`Listening on port ${port}`));

//DB variables

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'the_password',
    database : 'user'
});

//connect with the DB

connection.connect(function(error)
{
    if(error)
    {
        console.log('Error connecting with the DB')
        console.log("Cause : "+error.message)
    }
    else
    {
        console.log('Connected with the DB')
    }
});

// api #1 register (Crud)

app.post('/api/register', function(req, res)
{
    
    const uname = req.body.name;
    const email = req.body.email;
    const ph = req.body.phone;
    const pass = req.body.password;
    
    if (uname != undefined || email != undefined || ph != undefined || pass != undefined)
    {
        connection.query("SELECT * FROM user WHERE username = '"+uname+"' or email = '"+email+"' or phone = '"+ph+"'", function(error, results)
        {
            if (error)
            {
                console.log("[Err 1]Something went wrong, please try again later...")
                res.send({reasult: "Something went wrong, please try again later..."});
                return
            }
            else
            {
                if (results[0] == undefined)
                {
                const uuid = uuidv4()
                connection.query("INSERT INTO user(`uuid`,`username`, `email`, `phone`, `password`) VALUES ('"+uuid+"', '"+uname+"', '"+email+"', '"+ph+"', '"+pass+"')", function (error)
                {
                    if (error)
                    {
			console.log("Error : "+error.name+", "+"Probable cause : "+error.message)
                        res.send({reasult: "Failed to register!"})
                    }
                    else
                    {
                        res.send({reasult: "Registration Sucessful! you can login now..."})
                    }
                });
                }
                else
                {
                    res.send({reasult: "Account can't be created"})
                }
            }
        });
    }
    else
    {
        res.send({reasult: "All the feilds are required"})
    }
    
});

// api #2 user lookup (cRud)

app.post('/api/users_lookup/:name', function(req, res)
{
    const name = req.params.name
    const the_token = req.body.token
    
    if (the_token == undefined) 
    {
        res.status(401)
        res.send({reasult: "Token Undefined"})
    }
    else 
    {
	try
	{
		var decoded = jwt.decode(the_token)
        	var uuid_t = decoded.id		
	}
	catch (err)
	{
		console.log("Error : "+err.name+", "+"Probable cause : "+err.message)
		res.status(401)
		res.send({reasult: "Invalid Token!"});
		return
		
	}
        
        connection.query("SELECT * FROM user WHERE uuid = '"+uuid_t+"'", function (error, results)
        {
            if (error)
            {
                    console.log("[Err 1]Something went wrong, please try again later...")
                    res.send({reasult: "Something went wrong, please try again later..."});
                    return
            }
            else
            {
                var secc = results[0].user_secret
                jwt.verify(the_token, secc, function(err)
                {
                    if (err)
                    {
                        console.log("Error : "+err.name+", "+"Probable cause : "+err.message)
                        res.status(401)
                        res.send({reasult : "Invalid Token!"})
                    }
                    else
                    {
                        connection.query("SELECT * FROM user WHERE username = '"+name+"'", function (error, results)
                        {
                            if (error)
                            {
                                console.log("[Err 2]Something went wrong, please try again later...")
                                res.send({reasult: "Something went wrong, please try again later..."});
                                return
                            }
                            else
                            {
                                try
                                {
                                    db_r = {
                                        "Name ": results[0].username, 
                                        "Email": results[0].email,
                                        "Phone": results[0].phone
                                    }
                                    var response = {reasult: db_r}
                                    res.send(response);
                                    return
                                }
                                catch (e) 
                                {
                                    if (e.name == 'TypeError')
                                    {
                                        res.status(404)
                                        res.send({reasult: "No user found by that name"});
                                        return
                                    }
                                    else
                                    { 
                                        res.send({reasult: "[Err 2]Something went wrong, please try again later..."});
                                        return
                                    }
                                }
                            }           
                        });
                    }
                });
            }
        });
    }
});

// api #3 user update (crUd)

app.put('/api/users_update/', function(req, res)
{
    const field_name = req.body.field
    const field_val = req.body.new_val
    const the_token = req.body.token

    if (the_token == undefined) 
    {
	res.status(401)
        res.send({reasult: "Token Undefined"})
    }
    else if (field_name == "uuid")
    {
        res.status(401)
        res.send({result : "Unauthorized"})
    }
    else
    {
        try
	{
		var decoded = jwt.decode(the_token)
        	var uuid_t = decoded.id		
	}
	catch (err)
	{
		console.log("Error : "+err.name+", "+"Probable cause : "+err.message)
		res.status(401)
		res.send({reasult: "Invalid Token!"});
		return
		
	}
        connection.query("SELECT * FROM user WHERE uuid = '"+uuid_t+"'", function (error, results)
        {
            if (error)
            {
                console.log("[Err 1]Something went wrong, please try again later...")
                res.send({reasult: "Something went wrong, please try again later..."});
                return
            }
            else
            {
                try 
                {
                    const secc = results[0].user_secret
                    jwt.verify(the_token, secc, function(error)
                    {
                        if (error)
                        {
                            console.log("Error : "+error.name+", "+"Probable cause : "+error.message)
                            res.status(401)
                            res.send({reasult : "Invalid Token!"})
                        }
                        else
                        {                                        
                            connection.query("SELECT * FROM user WHERE "+field_name+" = '"+field_val+"'", function (error, results)
                            {
                                if (error)
                                {
                                    console.log("[Err 2]Something went wrong, please try again later...")
                                    res.send({reasult: "Something went wrong, please try again later..."});
                                    return
                                }
                                else
                                {
                                    try
                                    {
                                        results[0].username
                                        res.send({result : "Your "+field_name+" can't be updated as it's already in use"})
                                    }
                                    catch (e)
                                    {    
                                        if (e.name == "TypeError")
                                        {
                                            connection.query("SELECT * FROM user WHERE uuid = '"+uuid_t+"'", function (error, results)
                                            {
                                                if (error)
                                                {
                                                    console.log("[Err 4]Something went wrong, please try again later...")
                                                    res.send({reasult: "Something went wrong, please try again later..."});
                                                    return
                                                }
                                                else
                                                {
                                                    try
                                                    {
                                                        var Name = results[0].username
                                                        connection.query("UPDATE user SET "+field_name+" = '"+field_val+"' WHERE username = '"+Name+"'", function(error)
                                                        {
                                                            if (error)
                                                            {
                                                                console.log("[Err 5]Something went wrong, please try again later...")
                                                                res.send({reasult: "Something went wrong, please try again later..."});
                                                                return
                                                            }
                                                            else
                                                            {
                                                                res.send({reasult: "Your "+field_name+" has been successfully updated"})
                                                                return   
                                                            }
                                                        })
                                                    }
                                                    catch (e) 
                                                    {
                                                        if (e.name == "TypeError")
                                                        {
                                                            res.send({reasult: "No user found by that name"});
                                                            return
                                                        }
                                                        else
                                                        {
                                                            console.log("[Err 6]Something went wrong, please try again later...")
                                                            res.send({reasult: "Something went wrong, please try again later..."});
                                                            return
                                                        }
                                                    }
                                                }                 
                                            })
                                        }
                                        else
                                        {
                                            console.log(e.name+" | "+e.message)
                                            console.log("[Err 3]Something went wrong, please try again later...")
                                            res.send({reasult: "Something went wrong, please try again later..."});
                                            return
                                        }                             
                                    }
                                }
                            });                    
                        }
                    });
                }
                catch (e)
                {
                    if (e.name == "TypeError")
                    {
                        res.status(401)
                        res.send({reasult : "Invalid token!"})
                    }
                    else
                    {
                        console.log("[Err 7]Something went wrong, please try again later...")
                        res.send({reasult: "Something went wrong, please try again later..."})
                    }
                }   
            }
        });
    }
});

// api #4 user delete (cruD)

app.delete('/api/delete/', function(req, res)
{
    const the_token = req.body.token
    
    if (the_token == undefined)
    {
	res.status(401)
        res.send({reasult: "Token Undefined!"})
    }
    else
    {
        try
	{
		var decoded = jwt.decode(the_token)
        	var uuid_t = decoded.id		
	}
	catch (err)
	{
		console.log("Error : "+err.name+", "+"Probable cause : "+err.message)
		res.status(401)
		res.send({reasult: "Invalid Token!"});
		return
		
	}
        connection.query("SELECT * FROM user WHERE uuid = '"+uuid_t+"'", function (error, results, fields)
        {
            if (error)
            {
                console.log("[Err 1]Something went wrong, please try again later...")
                res.send({reasult: "Something went wrong, please try again later..."});
                return
            }
            else
            {
                try 
                {
                    const secc = results[0].user_secret
                    jwt.verify(the_token, secc, function(error)
                    {
                        if (error)
                        {
                            console.log("Error : "+error.name+", "+"Probable cause : "+error.message)
                            res.status(401)
                            res.send({reasult : "Invalid Token!"})
                        }
                        else
                        {                                        
                            connection.query("SELECT * FROM user WHERE uuid = '"+uuid_t+"'", function (error, results, fields)
                            {
                                if (error)
                                {
                                    console.log("[Err 2]Something went wrong, please try again later...")
                                    res.send({reasult: "Something went wrong, please try again later..."})
                                    return
                                }
                                else
                                {
                                    try
                                    {
                                        var Name = results[0].username
                                        connection.query("DELETE FROM user WHERE username = '"+Name+"'", function(error, reasults, fields)
                                        {
                                            db_r = "User "+Name+", has been deleted successfully"
                                            res.send({reasult: db_r})
                                            return
                                        })
                                    }
                                    catch (e)
                                    {
                                        if (e.name == "TypeError")
                                        {
                                            res.send({reasult: "No user found by that name"})
                                            return
                                        }
                                        else
                                        { 
                                            res.send({reasult: "[Err 3]Something went wrong, please try again later..."})
                                            return
                                        }
                                    }
                                }                       
                            });                                
                        }
                    });
                }
                catch (e)
                {
                    if (e.name == "TypeError")
                    {
                        res.status(401)
                        res.send({reasult : "Invalid token!"})
                    }
                    else
                    {
                        console.log("[Err 4]Something went wrong, please try again later...")
                        res.send({reasult: "Something went wrong, please try again later..."})
                    }
                }   
            }
        });         
    }
});

// api #5 login

app.post('/api/login', function(req, res)
{
    
    const uname = req.body.name;
    const pass = req.body.password;

    connection.query("SELECT * FROM user WHERE username = '"+uname+"' AND password = '"+pass+"'", function (error, results, fields)
    {
        try
        {
            if (results[0].username == uname && results[0].password == pass)
            {
                function generateHexString(length)
                {
                    var ret = "";
                    while (ret.length < length)
                    {
                      ret += Math.random().toString(16).substring(2);
                    }
                    return ret.substring(0,length);
                }
                
                // 256-bit WEP: 58 digit key
                const sec_key = generateHexString(58)
                //console.log("256-bit Key : "+sec_key);
                connection.query("UPDATE user SET user_secret = '"+sec_key+"' WHERE username = '"+uname+"'", function (error)
                {
                    if (error)
                    {
                        console.log(error.name)
                    }
                });

                const token = jwt.sign({id : results[0].uuid}, sec_key, {expiresIn: "8h"})
                res.send({reasult: "Welcome! "+results[0].username+", good to see you...", Token: token})
            }
        }
        catch (e)
        {
            if (e.name == 'TypeError')
            {
		res.status(401)
                res.send({reasult: "Username or password incorrect"})
            }
            else
            {
                res.send({reasult: "Something went wrong, please try again later...!"})
            }   
        }
    });
});


// api #6 logout

app.put('/api/users_logout/', function(req, res)
{
    const the_token = req.body.token
    
    if (the_token == undefined)
    {
	res.status(401)
        res.send({reasult: "Token Undefined!"})
    }
    else
    {           
        try
	{
		var decoded = jwt.decode(the_token)
        	var uuid_t = decoded.id		
	}
	catch (err)
	{
		console.log("Error : "+err.name+", "+"Probable cause : "+err.message)
		res.status(401)
		res.send({reasult: "Invalid Token!"});
		return
		
	}
        connection.query("SELECT * FROM user WHERE uuid = '"+uuid_t+"'", function (error, results, fields)
        {
            if (error)
            {
                console.log("[Err 1]Something went wrong, please try again later...")
                res.send({reasult: "Something went wrong, please try again later..."});
                return
            }
            else
            {
                try
                {
                    var secc = results[0].user_secret
                    jwt.verify(the_token, secc, function(err)
                    {
                        if (err)
                        {
                            console.log("Error : "+err.name+", "+"Probable cause : "+err.message)
                            res.status(401)
                            res.send({reasult : "Invalid Token!"})
                        }
                        else
                        {                                        
                            connection.query("UPDATE user SET user_secret = Null WHERE uuid = '"+uuid_t+"'", function (error, results, fields)
                            {
                                if (error)
                                {
                                    console.log("[Err 2]Something went wrong, please try again later...")
                                    res.send({reasult: "Something went wrong, please try again later..."});
                                    return
                                }
                                else
                                {
                                    res.send({reasult : "You have been successfully logged out"})
                                }                 
                            })                
                        }
                    });
                }
                catch (e)
                {
                    if (e.name == "TypeError")
                    {
                        res.status(401)
                        res.send({reasult : "Invalid token!"})
                    }
                    else
                    {
                        console.log("[Err 3]Something went wrong, please try again later...")
                        res.send({reasult: "Something went wrong, please try again later..."})
                    }
                }   
            }
        });
    }
});


/*
Regex for Email - [a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?
*/ 
