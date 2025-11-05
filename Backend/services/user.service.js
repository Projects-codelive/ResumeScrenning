const userModel = require('../models/user.model')

module.exports.createUser = async ({firstname, lastname, email, password}) => {
    if(!firstname || !email || !password){
        throw new Error('All fields are required')
    }

    const user = await userModel.create({
        fullname:{
            firstname,
            lastname
        },
        email,
        password,
        provider: 'local'
    })

    return user
}

// OAuth user creation
module.exports.createOAuthUser = async ({googleId, githubId, firstname, lastname, email, provider}) => {
    if(!firstname || !email || !provider){
        throw new Error('Required fields missing for OAuth user')
    }

    const userData = {
        fullname: {
            firstname,
            lastname: lastname || ''
        },
        email,
        provider
    };

    if (googleId) userData.googleId = googleId;
    if (githubId) userData.githubId = githubId;

    // console.log('Creating OAuth user with data:', userData);
    const user = await userModel.create(userData);
    // console.log('OAuth user created successfully:', user);
    return user;
}
