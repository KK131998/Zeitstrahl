/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_856668217")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "file1962578385",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "bild",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_856668217")

  // remove field
  collection.fields.removeById("file1962578385")

  return app.save(collection)
})
