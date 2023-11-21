import { AggregateFilter, IPaginationResult, QueryFilter} from "./types/types";
import { Aggregate, Model, Query, Schema } from 'mongoose'

const defaultFilterValues = {
    sort: "",
    limit: 10,
    page: 1,
    select: "",
    populate: "",
    project: {},
    allowDiskUse: false,
    lean: false,
    labels: {}
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

class Paginate {

    async paginateQuery<T>(dbQuery: Query<T, any>, filter?: QueryFilter): Promise<IPaginationResult> {
        const filterQuery = {
            ...defaultFilterValues,
            ...filter,
        }
        let { limit, page, sort, select, allowDiskUse, populate, labels } = filterQuery;
        const resultLabels = { ...defaultLabels, ...labels }
        if(!page || page < 1){page = 1}

        const skip = (page - 1) * limit;
        dbQuery.allowDiskUse(allowDiskUse)
        dbQuery.lean(filterQuery.lean)

        const countQuery = dbQuery.clone();
        if (sort) {
            dbQuery.sort(sort)
        }
        dbQuery.skip(skip).select(select);
        if (populate) {
            dbQuery.populate(populate)
        }
        if (limit >= 1) {
            dbQuery.limit(limit);
        }
        const data = await dbQuery;

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
            [resultLabels.prevPage]: page < 1 ? null : totalPages > 1 && page > 1 ? page - 1 : null,
            [resultLabels.nextPage]: totalPages > 1 && page >= 1 && page < totalPages ? page + 1 : null,
        };
    }

    async paginateAggregate<T>(dbQuery: Aggregate<T[]>, model: Model<T>, filter?: AggregateFilter): Promise<IPaginationResult> {
        const filterQuery = {
            ...defaultFilterValues,
            ...filter,
        }
        let { limit, page, sort, allowDiskUse, project, lookup, labels } = filterQuery;
        const resultLabels = { ...defaultLabels, ...labels }
        if(!page || page < 1){page = 1}

        
        const skip = (page - 1) * limit;
        dbQuery.allowDiskUse(allowDiskUse)

        if (!model) throw new Error("Model is required")
        const countQuery = [...dbQuery.pipeline()];
        if (sort) {
            dbQuery.sort(sort);
        }
        dbQuery.skip(skip);

        if (limit >= 1) {
            dbQuery.limit(limit);
        }
        if (lookup && Object.keys(lookup).length) {
            dbQuery.lookup(lookup);
        }
        if (Object.keys(project).length > 0) {
            dbQuery.project(project);
        }

        const totalPipeline = countQuery.concat([
            { $group: { _id: null, count: { $sum: 1 } } },
        ]);

        const data = await model.aggregate(dbQuery.pipeline());
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
            [resultLabels.prevPage]: page < 1 ? null : totalPages > 1 && page > 1 ? page - 1 : null,
            [resultLabels.nextPage]: totalPages > 1 && page >= 1 && page < totalPages ? page + 1 : null,
        };
    }
}

const paginate = new Paginate();

const paginatePlugin = (schema: any) => {
    schema.statics.paginateAggregate = paginate.paginateAggregate;
    schema.statics.paginateQuery = paginate.paginateQuery;
}

export {paginate, paginatePlugin};
