/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1372600823")

  // remove field
  collection.fields.removeById("number2862495610")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3145888567",
    "max": null,
    "min": null,
    "name": "year",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1372600823")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number2862495610",
    "max": null,
    "min": null,
    "name": "date",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("number3145888567")

  return app.save(collection)
})
