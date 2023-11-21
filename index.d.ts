import { Aggregate, Model, Query } from "mongoose";

interface IAggregateLookup {
    from: string,
    localField: string,
    foreignField: string,
    as: string
}

interface ILabels {
    docs?: string,
    totalDocs?: string,
    limit?: string,
    hasNextPage?: string,
    hasPrevPage?: string,
    page?: string,
    totalPages?: string,
    prevPage?: string,
    nextPage?: string,
    pagingCounter?: string
}

class CommonFilter {
    page?: number;
    limit?: number;
    sort?: string | { [key: string]: any };
    labels?: ILabels
}

export class QueryFilter extends CommonFilter {
    select?: string | string[] | { [key: string]: number };
    populate?: string | string[];
    lean?: boolean;
}

export class AggregateFilter extends CommonFilter {
    project?: { [key: string]: any };
    lookup?: IAggregateLookup;
}

export interface IPaginationResult {
    [x: string]: any;
}

export interface IDefaultPaginationResult {
    docs: any[],
    totalDocs: number,
    limit: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
    page: number,
    totalPages: number,
    prevPage: null | number,
    nextPage: null | number,
    pagingCounter: string
}


declare module "mongoose-simple-paginate" {
    function paginateAggregate<T>(dbQuery: Aggregate<T[]>,
        model: Model<T & Document>,
        filter?: AggregateFilter): IPaginationResult;
    function paginateQuery<T>(dbQuery: Query<T, any>,
        filter?: QueryFilter): IPaginationResult;


    export {
        paginateAggregate,
        paginateQuery
    }
}

declare module "mongoose" {
    interface PaginateModel<T, TQueryHelpers = {}, TMethods = {}>
        extends Model<T, TQueryHelpers, TMethods> {
            paginateAggregate<T>(
                dbQuery: Aggregate<T[]>,
                model: Model<T & Document>,
                filter?: AggregateFilter
            ): IPaginationResult;
            paginateQuery<T>(
                dbQuery: Query<T, any>,
                filter?: QueryFilter
            ): IPaginationResult;
    }
}