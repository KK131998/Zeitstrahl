/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1687431684")

  // remove field
  collection.fields.removeById("date2218467061")

  // remove field
  collection.fields.removeById("date2504064883")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2218467061",
    "max": null,
    "min": null,
    "name": "start_year",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2504064883",
    "max": null,
    "min": null,
    "name": "end_year",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1687431684")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date2218467061",
    "max": "",
    "min": "",
    "name": "start_year",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date2504064883",
    "max": "",
    "min": "",
    "name": "end_year",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // remove field
  collection.fields.removeById("number2218467061")

  // remove field
  collection.fields.removeById("number2504064883")

  return app.save(collection)
})
