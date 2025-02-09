const { entity, field } = require('@herbsjs/gotu')
const Repository = require('../../src/repository')
const db = require('./db')
const connection = require('../connection')
const assert = require('assert')
let pool = {}

describe('Query First', () => {

    const table = 'test_repository'
    const database = 'herbs2knex'

    before(async () => {
        pool = await db

        sql = `
        DROP DATABASE IF EXISTS ${database}`

        await pool.query(sql)

        sql = `CREATE DATABASE ${database}`
        
        await pool.query(sql)

        sql = `
        USE ${database}`

        await pool.query(sql)

        sql = `
        CREATE TABLE ${table} (
            id INT,
            string_test VARCHAR(400),
            boolean_test BIT,
            PRIMARY KEY (id)
        )`

        await pool.query(sql)
    })

    const givenAnRepositoryClass = (options) => {
        return class ItemRepositoryBase extends Repository {
            constructor() {
                super(options)
            }
        }
    }

    const givenAnEntity = () => {
        return entity('A entity', {
            id: field(Number),
            stringTest: field(String),
            booleanTest: field(Boolean)
        })
    }

    it('should return entities', async () => {
        //given
        const anEntity = givenAnEntity()
        const ItemRepository = givenAnRepositoryClass({
            entity: anEntity,
            table,
            database,
            ids: ['id'],
            knex: connection
        })
        const injection = {}
        await pool.query(`INSERT INTO ${table} (id, string_test, boolean_test) VALUES (10, 'marie', 1),(20, 'amelia', 1)`)
        const itemRepo = new ItemRepository(injection)


        //when
        const ret = await itemRepo.first({ orderBy: 'string_test' })

        //then
        assert.strictEqual(ret.length, 1)
        assert.deepStrictEqual(ret[0].toJSON(), { id: 20, stringTest: 'amelia', booleanTest: true })
    })

    it('should return empty array if there is no match', async () => {
        //given
        const anEntity = givenAnEntity()
        const ItemRepository = givenAnRepositoryClass({
            entity: anEntity,
            table,
            database,
            ids: ['id'],
            knex: connection
        })
        const injection = {}        
        const itemRepo = new ItemRepository(injection)


        //when
        const ret = await itemRepo.first({ where: { stringTest: ["jhon"] } })

        //then
        assert.strictEqual(ret.length, 0)
    })
})