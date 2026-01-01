/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_856668217")

  // remove field
  collection.fields.removeById("date1155742626")

  // remove field
  collection.fields.removeById("date2152953156")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number1155742626",
    "max": null,
    "min": null,
    "name": "born",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2152953156",
    "max": null,
    "min": null,
    "name": "died",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_856668217")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date1155742626",
    "max": "",
    "min": "",
    "name": "born",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date2152953156",
    "max": "",
    "min": "",
    "name": "died",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // remove field
  collection.fields.removeById("number1155742626")

  // remove field
  collection.fields.removeById("number2152953156")

  return app.save(collection)
})
