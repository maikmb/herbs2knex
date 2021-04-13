const Convention = require("./convention")
const DataMapper = require("./dataMapper")
const { isEmpty } = require("./helpers/isEmpty")

const dependency = { convention: Convention }

module.exports = class Repository {
  constructor(options) {
    const di = Object.assign({}, dependency, options.injection)
    this.convention = di.convention
    this.table = options.table
    this.schema = options.schema
    this.tableQualifiedName = this.schema
      ? `${this.schema}.${this.table}`
      : `${this.table}`
    this.entity = options.entity
    this.entityIDs = options.ids
    this.foreignKeys = options.foreignKeys
    this.knex = options.knex
    this.runner = this.knex(this.tableQualifiedName)
    this.dataMapper = new DataMapper(this.entity, this.entityIDs, this.foreignKeys)
  }

  async findByID(ids) {
    const tableIDs = this.dataMapper.tableIDs()
    const tableFields = this.dataMapper.tableFields()

    const parsedValue = Array.isArray(ids) ? ids : [ids]
    const ret = await this.runner
      .select(tableFields)
      .whereIn(tableIDs[0], parsedValue)

    const entities = []

    for (const row of ret) {
      if (row === undefined) continue
      entities.push(this.dataMapper.toEntity(row))
    }

    return entities
  }

  /** 
 *
 * Find data using pagination
 * 
 * @param {type}   object.limit Limit items to list
 * @param {type}   object.offset List items offset
 * @param {type}   object.orderBy Order by query
 *
 * @return {type} List of entities
 */
  async findWithPage(options = {
    orderBy: [],
    offset: 1,
    limit: 10
  }) {

    options.orderBy = options.orderBy || []
    options.offset = options.offset || 1
    options.limit = options.limit || 10

    const tableFields = this.dataMapper.tableFields()

    if (!options.orderBy || typeof options.orderBy === "object" && !Array.isArray(options.orderBy) && isEmpty(options.orderBy)) throw "order by is invalid"

    let query = this.runner
      .select(tableFields)
      .offset(options.offset)
      .limit(options.limit)

    if (!isEmpty(options.orderBy)) query = query.orderBy(options.orderBy)

    const entities = []
    const ret = await query

    for (const row of ret) {
      if (row === undefined) continue
      entities.push(this.dataMapper.toEntity(row))
    }

    let count = await this.runner
      .count('* as count')
      .first()

    return {
      total: count,
      perPage: options.limit,
      totalPages: Math.ceil(count / options.limit),
      data: entities
    }
  }

  /** 
  *
  * Find all method
  * 
  * @param {type}   object.limit Limit items to list  
  * @param {type}   object.orderBy Order by query
  *
  * @return {type} List of entities
  */
  async findAll(options = {
    orderBy: [],
    limit: 0
  }) {

    options.orderBy = options.orderBy || []
    options.limit = options.limit || 0

    const tableFields = this.dataMapper.tableFields()

    if (!options.orderBy || typeof options.orderBy === "object" && !Array.isArray(options.orderBy) && isEmpty(options.orderBy)) throw "order by is invalid"

    let query = this.runner
      .select(tableFields)

    if (options.limit > 0) query = query.limit(options.limit)
    if (!isEmpty(options.orderBy)) query = query.orderBy(options.orderBy)

    const entities = []
    const ret = await query

    for (const row of ret) {
      if (row === undefined) continue
      entities.push(this.dataMapper.toEntity(row))
    }

    return entities
  }

  async findBy(search) {

    const tableFields = this.dataMapper.tableFields()
    const searchTermTableField = this.dataMapper.toTableFieldName(Object.keys(search)[0])
    const searchTerm = Object.keys(search)[0]
    if (!searchTerm || searchTerm === "0") throw "search term is invalid"

    const searchValue = Array.isArray(search[searchTerm])
      ? search[searchTerm]
      : [search[searchTerm]]

    if (
      !search[searchTerm] ||
      (typeof search[searchTerm] === "object" &&
        !Array.isArray(search[searchTerm])) ||
      (Array.isArray(search[searchTerm]) && !search[searchTerm].length)
    )
      throw "search value is invalid"

    const ret = await this.runner
      .select(tableFields)
      .whereIn(searchTermTableField, searchValue)

    const entities = []

    for (const row of ret) {
      if (row === undefined) continue
      entities.push(this.dataMapper.toEntity(row))
    }

    return entities
  }

  async insert(entityInstance) {
    const fields = this.dataMapper.tableFields()
    const payload = this.dataMapper.tableFieldsWithValue(entityInstance)

    const ret = await this.runner
      .returning(fields)
      .insert(payload)

    return this.dataMapper.toEntity(ret[0])
  }

  async update(entityInstance) {
    const tableIDs = this.dataMapper.tableIDs()
    const fields = this.dataMapper.tableFields()
    const payload = this.dataMapper.tableFieldsWithValue(entityInstance)

    const ret = await this.runner
      .where(tableIDs[0], entityInstance[tableIDs[0]])
      .returning(fields)
      .update(payload)

    return this.dataMapper.toEntity(ret[0])
  }

  async delete(entityInstance) {
    const tableIDs = this.dataMapper.tableIDs()

    const ret = await this.runner
      .where(tableIDs[0], entityInstance[tableIDs[0]])
      .delete()

    return ret === 1
  }

}
