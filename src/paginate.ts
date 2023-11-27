import mongoose, { EasyPaginateModel, FilterQuery, PipelineStage } from 'mongoose'
import { AggregateFilter, IPaginationResult, QueryFilter } from '..';

const defaultFilterValues = {
    sort: "",
    limit: 10,
    page: 1,
    select: "",
    populate: "",
    project: {},
    allowDiskUse: false,
    lean: false,
    labels: {},
    collation: undefined
}

const defaultLabels = {
    docs: "docs",
    totalDocs: "totalDocs",
    limit: "limit",
    hasNextPage: "hasNextPage",
    hasPrevPage: "hasPrevPage",
    page: "page",
    totalPages: "totalPages",
    prevPage: "prevPage",
    nextPage: "nextPage",
    pagingCounter: "pagingCounter"
}


async function paginateQuery<T>(dbQuery?: FilterQuery<T>, filter?: QueryFilter): Promise<IPaginationResult<T>> {
    const filterQuery = {
        ...defaultFilterValues,
        ...filter,
    }
    let { limit, page, sort, select, allowDiskUse, populate, labels, collation } = filterQuery;
    const resultLabels = { ...defaultLabels, ...labels }
    if (!page || page < 1) { page = 1 }

    dbQuery = dbQuery || {}
    const model = this as EasyPaginateModel<T>;
    
    const query = model.find(dbQuery)

    if (collation && Object.keys(collation).length) {
        query.collation(collation);
    }

    const skip = (page - 1) * limit;
    query.allowDiskUse(allowDiskUse)
    query.lean(filterQuery.lean)

    const countQuery = query.clone();
    if (sort) {
        query.sort(sort)
    }
    query.skip(skip).select(select);
    if (populate) {
        query.populate(populate)
    }
    if (limit >= 1) {
        query.limit(limit);
    }
    const data = await query;

    const total = await countQuery.countDocuments().exec();
    const totalPages = limit < 1 ? 0 : Math.ceil(total / limit)

    return {
        [resultLabels.docs]: data,
        [resultLabels.totalDocs]: total,
        [resultLabels.limit]: limit,
        [resultLabels.hasNextPage]: page * limit < total,
        [resultLabels.hasPrevPage]: page > 1,
        [resultLabels.page]: page,
        [resultLabels.totalPages]: totalPages,
        [resultLabels.pagingCounter]: (page - 1) * limit + 1,
        [resultLabels.prevPage]: page < 1 ? null : totalPages > 1 && page > 1 ? page - 1 : null,
        [resultLabels.nextPage]: totalPages > 1 && page >= 1 && page < totalPages ? page + 1 : null,
    };
}

async function paginateAggregate<T>(dbQuery?: PipelineStage[], filter?: AggregateFilter): Promise<IPaginationResult<T>> {
    const filterQuery = {
        ...defaultFilterValues,
        ...filter,
    }
    let { limit, page, sort, allowDiskUse, project, lookup, labels, collation } = filterQuery;
    const resultLabels = { ...defaultLabels, ...labels }
    if (!page || page < 1) { page = 1 }
    const model = this as EasyPaginateModel<T>

    const query = model.aggregate(dbQuery || [])

    const skip = (page - 1) * limit;
    query.allowDiskUse(allowDiskUse)

    const countQuery = [...query.pipeline()];

    if (collation && Object.keys(collation).length) {
        query.collation(collation);
    }

    if (sort) {
        query.sort(sort);
    }
    query.skip(skip);

    if (limit >= 1) {
        query.limit(limit);
    }
    if (lookup && Object.keys(lookup).length) {
        query.lookup(lookup);
    }
    if (Object.keys(project).length > 0) {
        query.project(project);
    }

    const totalPipeline = countQuery.concat([
        { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const data = await model.aggregate(query.pipeline());
    const totalResult = await model.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].count : 0;
    const totalPages = limit < 1 ? 0 : Math.ceil(total / limit)

    return {
        [resultLabels.docs]: data,
        [resultLabels.totalDocs]: total,
        [resultLabels.limit]: limit,
        [resultLabels.hasNextPage]: page * limit < total,
        [resultLabels.hasPrevPage]: page > 1,
        [resultLabels.page]: page,
        [resultLabels.totalPages]: totalPages,
        [resultLabels.pagingCounter]: (page - 1) * limit + 1,
        [resultLabels.prevPage]: page < 1 ? null : totalPages > 1 && page > 1 ? page - 1 : null,
        [resultLabels.nextPage]: totalPages > 1 && page >= 1 && page < totalPages ? page + 1 : null,
    };
}

export default (schema: mongoose.Schema) => {
    schema.statics.paginateAggregate = paginateAggregate;
    schema.statics.paginateQuery = paginateQuery;
}