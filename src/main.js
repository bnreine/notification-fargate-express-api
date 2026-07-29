async function runFn() {
    try{
        console.log('running task')
    }catch(err){
        console.log(err)
    }

}




if(process.env.NODE_ENV !== 'dev') {
    runFn().catch(console.error);
}


module.exports.run = runFn;