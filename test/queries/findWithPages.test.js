const { entity, field } = require('gotu')
const Repository = require('../../src/repository')
const assert = require('assert')

describe('Query With Pages', () => {

    const givenAnEntity = () => {
        const ParentEntity = entity('A Parent Entity', {})

        return entity('A entity', {
            id: field(Number),
            stringTest: field(String),
            booleanTest: field(Boolean),
            entityTest: field(ParentEntity),
            entitiesTest: field([ParentEntity]),
        })
    }

    const givenAnRepositoryClass = (options) => {
        return class ItemRepositoryBase extends Repository {
            constructor(options) {
                super(options)
            }
        }
    }

    const knex = (ret, spy = {}) => (
        () => ({
            count: (f) => {
                return {
                    first: () => ret.length
                }
            },
            select: (s) => {
                spy.select = s
                const builder = {
                    orderBy: (o) => {
                        spy.orderBy = o
                        return ret
                    },
                    limit: (o) => {
                        spy.limit = o
                        return ret.slice(0, o)
                    },
                    offset: (o) => {
                        spy.offset = o        
                        return builder
                    },                    
                }
                return builder
            }
        })
    )

    it('should return entities using limit and offset', async () => {
        //given
        let spy = {}
        const retFromDeb = [
            { id: 1, string_test: "john", boolean_test: true },
            { id: 2, string_test: "clare", boolean_test: false },
            { id: 1, string_test: "john", boolean_test: true },
            { id: 2, string_test: "clare", boolean_test: false },
            { id: 1, string_test: "john", boolean_test: true },
            { id: 2, string_test: "clare", boolean_test: false },
            { id: 1, string_test: "john", boolean_test: true },
            { id: 2, string_test: "clare", boolean_test: false },
            { id: 1, string_test: "john", boolean_test: true },
            { id: 2, string_test: "clare", boolean_test: false }
        ]
        const anEntity = givenAnEntity()
        const ItemRepository = givenAnRepositoryClass()
        const itemRepo = new ItemRepository({
            entity: anEntity,
            table: 'aTable',
            ids: ['id'],
            knex: knex(retFromDeb, spy)
        })

        //when
        const ret = await itemRepo.findWithPage({ limit: 5, offset: 1 })

        //then
        assert.strictEqual(ret.data.length, 5)
        assert.strictEqual(ret.totalPages, 2)
        assert.strictEqual(ret.total, 10)
        assert.strictEqual(ret.perPage, 5)
        assert.deepStrictEqual(spy.limit, 5)
        assert.deepStrictEqual(spy.offset, 1)

    })
   
})