const {debug} = require('../../lib/debug')

/* ===================================================================
 * references:
 * -----------
 * https://github.com/sidorares/node-mysql2/blob/master/examples/mysqlproxy.js
 * ===================================================================
 */

const sendResult = async (cl_conn, db_result) => {
 
    cl_conn.writeColumns(db_result.fields);
    await Promise.all(db_result.rows.map(async row => {
      cl_conn.writeTextRow(row)
      return;
    }))
    cl_conn.writeEof();

    cl_conn.sequenceId = 0
  
}

const handle_events = function({server, onQuery, db}) {
  let id = 0

  server.on('connection', (cl_conn) => {
    let db_conn = null


    cl_conn.serverHandshake({
      protocolVersion: 10,
      serverVersion:   'mysql-proxy',
      connectionId:    id++,
      statusFlags:     2,
      characterSet:    8,
      capabilityFlags: 0xffffff,
      authCallback: async data => {
        console.log("authData",data)
        cl_conn.boilingdata = {
          credentials: data.user
        }
        cl_conn.writeOk()
               
        cl_conn.sequenceId = 0
      }
    })
    cl_conn.on('ping', async () => {
      cl_conn.writeOk()
  
      cl_conn.sequenceId = 0
    })

    cl_conn.on('query', async (query) =>  {
      cl_conn.sequenceId = 1
      try{
        let result = await onQuery(query, {boilingdata: cl_conn.boilingdata, })
        await sendResult(cl_conn, result)
      }catch(e){
        cl_conn.writeError({code: 1064, message: err.message})
      }
    })

    cl_conn.on('init_db', (schemaName) => {
      cl_conn.emit('query', `USE ${schemaName};`)
    })

    cl_conn.on('field_list', (table, fields) => {
      cl_conn.writeEof()
    })

    cl_conn.on('end', () => {
      if (db_conn) {
      
        db_conn = null
      }
    })

    cl_conn.on('error', (err) => {
      if (db_conn) {
       
        db_conn = null
      }

      if (err && err.code)
        debug('[ERROR]', `Client connection closed (${err.code})`)
    })
  })
}

module.exports = handle_events
