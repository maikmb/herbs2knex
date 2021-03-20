const DataMapper = require('../src/dataMapper')
const { entity, field } = require('gotu')
const assert = require('assert')

describe('Data Mapper', () => {

    describe('Simple Entity', () => {

        const givenAnEntity = () => {
            return entity('A entity', {
                idField: field(Number),
                field1: field(Boolean),
                fieldName: field(Boolean)
            })
        }

        it('should create a data mapper', () => {
            //given
            const entity = givenAnEntity()

            //when
            const proxy = DataMapper.getProxyFrom(entity)

            //then
            assert.deepStrictEqual(proxy._mapper.data, undefined)
        })

        it('should load data from DB', () => {
            //given
            const entity = givenAnEntity()
            const proxy = DataMapper.getProxyFrom(entity)

            //when
            proxy._mapper.load({ id_field: 1, field1: true, field_name: false })

            //then
            assert.deepStrictEqual(proxy._mapper.payload, { id_field: 1, field1: true, field_name: false })
        })

        it('should convert data from table to entity', () => {
            //given
            const entity = givenAnEntity()

            //when
            const proxy = DataMapper.getProxyFrom(entity)
            proxy._mapper.load({ id_field: 1, field1: true, field_name: false })

            //then
            assert.deepStrictEqual(proxy.idField, 1)
            assert.deepStrictEqual(proxy.field1, true)
            assert.deepStrictEqual(proxy.fieldName, false)

        })

        it('should convert an entity field to the table string convetion', () => {
            //given
            const entity = givenAnEntity()
            const proxy = DataMapper.getProxyFrom(entity)

            //when
            const toEntity = proxy._mapper.toTableField('fieldName')

            //then
            assert.deepStrictEqual(toEntity, 'field_name')
        })

        it('should retrieve table ID from entity', () => {
            //given
            const entity = givenAnEntity()
            const proxy = DataMapper.getProxyFrom(entity, ['idField'])

            //when
            const toEntity = proxy._mapper.getTableIDs()

            //then
            assert.deepStrictEqual(toEntity, ['id_field'])
        })
    })

    describe('Complex Entity - Multiple Types', () => {

        const givenAnComplexEntity = () => {
            const ParentEntity = entity('A parent entity', {})
            
            return entity('A entity', {
                id: field(Number),
                name: field(String, {
                    validation: { presence: true, length: { minimum: 3 } }
                }),
                numberTest: field(Number),
                stringTest: field(String),
                booleanTest: field(Boolean),
                dateTest: field(Date),
                objectTest: field(Object),
                entityTest: field(ParentEntity),
                // TODO
                // arrayTest: field(Array),
                numbersTest: field([Number]),
                stringsTest: field([String]),
                booleansTest: field([Boolean]),
                datesTest: field([Date]),
                objectsTest: field([Object]),
                // arraysTest:field([Array]),
                entitiesTest: field([ParentEntity]),
            })
        }

        it('should convert data from table to entity', () => {
            //given
            const entity = givenAnComplexEntity()
            const samples = [
                ['id', 'id', 1],
                ['name', 'name', "clare"],
                ['number_test', 'numberTest', 1],
                ['string_test', 'stringTest', "s1"],
                ['boolean_test', 'booleanTest', true],
                ['date_test', 'dateTest', new Date()],
                ['object_test', 'objectTest', { x: 1 }],
                // TODO
                // ['array_test', 'arrayTest', [1]] 
                ['numbers_test', 'numbersTest', [1, 2]],
                ['strings_test', 'stringsTest', ["s1", "s2"]],
                ['booleans_test', 'booleansTest', [true, false]],
                ['dates_test', 'datesTest', [new Date(), new Date()]],
                ['objects_test', 'objectsTest', [{ x: 1 }, { y: 2 }]],
                // ['arrays_test', 'arraysTest', [[1]]] 
            ]

            //when
            const proxy = DataMapper.getProxyFrom(entity)
            const data = samples.map(i => { return { [i[0]]: i[2] } }).reduce((obj, i) => Object.assign(obj, i))
            proxy._mapper.load(data)

            //then
            samples.map(i => {
                assert.deepStrictEqual(proxy[i[1]], i[2])
            })

        })

        it('should return null from table to entity', () => {
            //given
            const entity = givenAnComplexEntity()
            const samples = [
                ['id', 'id', null],
                ['name', 'name', null],
                ['number_test', 'numberTest', null],
                ['string_test', 'stringTest', null],
                ['boolean_test', 'booleanTest', null],
                ['date_test', 'dateTest', null],
                ['object_test', 'objectTest', null],
                // TODO
                // ['array_test', 'arrayTest', [null]] 
                ['numbers_test', 'numbersTest', null],
                ['strings_test', 'stringsTest', [null, null]],
                ['booleans_test', 'booleansTest', [null, null]],
                ['dates_test', 'datesTest', [null, null]],
                ['objects_test', 'objectsTest', [null, null]],
                // ['arrays_test', 'arraysTest', [[null]]] 
            ]

            //when
            const proxy = DataMapper.getProxyFrom(entity)
            const data = samples.map(i => { return { [i[0]]: i[2] } }).reduce((obj, i) => Object.assign(obj, i))
            proxy._mapper.load(data)

            //then
            samples.map(i => {
                assert.deepStrictEqual(proxy[i[1]], i[2])
            })

        })
    })
})