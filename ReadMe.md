# Easy Mongoose Paginate

> A query and aggregate pagination library for [Mongoose](http://mongoosejs.com) with custom labels.


## Why This Plugin

Easy-mongoose-paginate is a simple pagination library inspired by [mongoose-paginate-v2](https://www.npmjs.com/package/mongoose-paginate-v2) with two main improvements:
1) Paginating both aggregate and find query with one package
3) Adding a direct style usage in addition to plugin approach -> in progress

The below documentation is not perfect. Feel free to contribute.
Having any fun usage of the package, feel free to update this readme

## Installation

```sh
npm install easy-mongoose-paginate
```

## Usage
### Plugin approach
Add paginate plugin to your schema and then use model `paginateQuery` and `paginateAggregate` methods:

```js
const mongoose = require('mongoose');
const EasyPaginateModel = require('easy-mongoose-paginate');

const userSchema = new mongoose.Schema({
  /* your schema definition */
});

userSchema.plugin(mongoosePaginate);

const userModel = mongoose.model('user', userSchema);

//Find query
const users = await userModel.paginateQuery({}, { select: "email", limit: 10 })

//Aggregate query
const users = await userModel.paginateAggregate([], { page: 1, limit: 10 }) 
```

### Typescript

Easy-mongoose-paginate ship with it's own type definition. There is no need to install types for it.

```ts
import { EasyPaginateModel } from 'mongoose';
import easyMongoosePaginate  from 'easy-mongoose-paginate';

const userSchema = new mongoose.Schema({
  /* your schema definition */
});

userSchema.plugin(mongoosePaginate);
interface userDocument extends Document, IUserSchema { }

const userModel = mongoose.model<UserDocument, EasyPaginateModel<UserDocument>>('user', userSchema);

//Find query
const users = await userModel.paginateQuery({}, { select: "email", limit: 10 }) // Usage

//Aggregate query
const users: IPaginationResult<T> = await userModel.paginateAggregate([], { page: 2, limit: 10 }) // Usage
```

### Model.paginate([query], [options], [callback])

Returns promise

**Parameters**

- `[query]` {Object} - Query criteria. [Documentation](https://docs.mongodb.org/manual/tutorial/query-documents)
- `[options]` {Object}

  - `[select]` {Object | String} - Fields to return (by default returns all fields). [Documentation](http://mongoosejs.com/docs/api.html#query_Query-select)
  - `[collation]` {Object} - Specify the collation [Documentation](https://docs.mongodb.com/manual/reference/collation/)
  - `[sort]` {Object | String} - Sort order. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-sort)
  - `[populate]` {Array | Object | String} - Paths which should be populated with other documents. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-populate)
  - `[project]` {String | Object} - Get/set the query projection. [Documentation](https://mongoosejs.com/docs/api/query.html#query_Query-projection)
  - `[lean=false]` {Boolean} - Should return plain javascript objects instead of Mongoose documents? [Documentation](http://mongoosejs.com/docs/api.html#query_Query-lean)
  - `[page=1]` {Number}
  - `[limit=10]` {Number}, Any number less than 1 will return all documents
  - `[labels]` {Object} - Developers can provide custom labels for manipulating the response data.
  - `[allowDiskUse]` {Boolean} - Set this to true, which allows the MongoDB server to use more than 100 MB for query. This option can let you work around QueryExceededMemoryLimitNoDiskUseAllowed errors from the MongoDB server. (Default: `False`)

**Return value**

Promise fulfilled with object having properties:

- `docs` {Array} - Array of documents
- `totalDocs` {Number} - Total number of documents in collection that match a query
- `limit` {Number} - Limit that was used
- `hasPrevPage` {Bool} - Availability of prev page.
- `hasNextPage` {Bool} - Availability of next page.
- `page` {Number} - Current page number
- `totalPages` {Number} - Total number of pages.
- `prevPage` {Number} - Previous page number if available or NULL
- `nextPage` {Number} - Next page number if available or NULL
- `pagingCounter` {Number} - The starting index/serial/chronological number of first document in current page. (Eg: if page=2 and limit=10, then pagingCounter will be 11). Easy mongoose paginate uses a 1-based page index

Please note that the above properties can be renamed by setting labels attribute.

### Sample Usage

#### Return first 10 documents from 100

```javascript
const options = {
  page: 1,
  limit: 10,
  collation: {
    locale: 'en',
  },
};

const results = await Model.paginateQuery({}, options)

//results
{
  // result.docs
  // result.totalDocs = 100
  // result.limit = 10
  // result.page = 1
  // result.totalPages = 10
  // result.hasNextPage = true
  // result.nextPage = 2
  // result.hasPrevPage = false
  // result.prevPage = null
  // result.pagingCounter = 1
};
```

### With custom return labels

Users can customize the names of the object returned by modifying the labels.

- totalDocs
- docs
- limit
- page
- nextPage
- prevPage
- hasNextPage
- hasPrevPage
- totalPages
- pagingCounter

You should pass the names of the properties you wish to change using `labels` object in options.
Same query with custom labels

```javascript
const myCustomLabels = {
  totalDocs: 'itemCount',
  docs: 'itemsList',
  limit: 'perPage',
  page: 'currentPage',
  nextPage: 'next',
  prevPage: 'prev',
  totalPages: 'pageCount',
  pagingCounter: 'slNo',
  meta: 'paginator',
};

const options = {
  page: 1,
  limit: 10,
  labels: myCustomLabels,
};

const results = await Model.paginateAggregate([], options)

//results
{
  // result.itemsList [here docs become itemsList]
  // result.paginator.itemCount = 100 [here totalDocs becomes itemCount]
  // result.paginator.perPage = 10 [here limit becomes perPage]
  // result.paginator.currentPage = 1 [here page becomes currentPage]
  // result.paginator.pageCount = 10 [here totalPages becomes pageCount]
  // result.paginator.next = 2 [here nextPage becomes next]
  // result.paginator.prev = null [here prevPage becomes prev]
  // result.paginator.slNo = 1 [here pagingCounter becomes slNo]
  // result.paginator.hasNextPage = true
  // result.paginator.hasPrevPage = false
};
```

### Other Examples

Using `offset` and `limit`:

```javascript
const results = await Model.paginateQuery({}, { offset: 30, limit: 10 })

//results
{
  // result.docs
  // result.totalPages
  // result.limit - 10
  // result.offset - 30
};
```

#### More advanced example

```javascript
var query = {};
var options = {
  select: 'title date author',
  sort: { date: -1 },
  populate: 'author',
  lean: true,
  limit: 10,
};
const user = await Book.paginateQuery(query, options)
```

#### Zero or negative limit

You can use `limit=0` to get all the data:

```js
const results = await Model.paginateAggregate([], { limit: 0 })

//results
{
  // result.docs - empty array
  // result.totalDocs
  // result.limit - 0
};
```


#### AllowDiskUse for large datasets

Sets the allowDiskUse option, which allows the MongoDB server to use more than 100 MB for query. This option can let you work around `QueryExceededMemoryLimitNoDiskUseAllowed` errors from the MongoDB server.

**Note that this option requires MongoDB server >= 4.4. Setting this option is a no-op for MongoDB 4.2 and earlier.**

```js
const options = {
  limit: 10,
  page: 1,
  allowDiskUse: true,
};

const results = await Model.paginateQuery({}, options)
```

Below are some references to understand more about preferences,

- <https://www.mongodb.com/docs/manual/tutorial/query-documents/>
- <https://mongoosejs.com/docs/api/query.html#>



[MIT](LICENSE)