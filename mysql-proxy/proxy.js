
const logger   = require('./lib/logger')
const {debug}  = require('./lib/debug')

const boilingdata = require("@boilingdata/node-boilingdata")

const proxy = function({db_host, db_port, db_user, db_password, pool, hold_connection, logs_dir, encrypt_fields, encrypt_secret}) {

  const {logQuery} = logger(logs_dir)

  const onQuery = (query, params) => {
    return new Promise(async (resolve, reject) => {
      if(!params.boilingdata.instance){
        let [bdUsername, bdPassword] = params.boilingdata.credentials.split(":")
        params.boilingdata.instance = new boilingdata.BoilingData({ username: bdUsername, password: bdPassword });
        await params.boilingdata.instance.connect();
      }
      
      // sanity check
      if (!query) {
        reject()
        return
      }

      logQuery(query,true,  true)
      debug('[QUERY]', query)
      


      let bdResult = await params.boilingdata.instance.execQueryPromise({ sql: query, keys: []})
      console.log("BD RETURNED!!!!")
      let columns = Object.keys(bdResult[0])
      let rows = bdResult.map(row => { return Object.values(row) })

      // TODO: All columns returned as varchar (columnType)
      var result = {
        rows,
        fields: columns.map(column => { return {
          catalog: 'def',
          schema: 'test',
          table: 'test_table',
          orgTable: 'test_table',
          name: column,
          orgName: 'beta',
          characterSet: 33,
          columnLength: 384,
          columnType: 253,
          flags: 0,
          decimals: 0
        } })
      
      }

     resolve(result)
        
      
    })
  }

  return {onQuery, db: {getConnection: async ()=>{console.log("getConnection")}, releaseConnection: async ()=>{console.log("getConnection")}}}
}

module.exports = proxy
