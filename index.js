#! /usr/bin/env node

const {argv_vals, bootstrap_server} = require('./mysql-proxy/bin/lib/process_argv')
const enable_debug_logging          = require('./mysql-proxy/lib/debug').enable

const start_server = require(`./mysql-proxy/servers/start_mysql`)

enable_debug_logging(true)

bootstrap_server(start_server)
