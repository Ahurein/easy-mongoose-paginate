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
    labels?: ILabels;
    collation?: {
        locale: string;
        [key: string]: any
    } | undefined
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

export interface IPaginationResult<T> {
    docs?: T[],
    totalDocs?: number,
    limit?: number,
    hasNextPage?: boolean,
    hasPrevPage?: boolean,
    page?: number,
    totalPages?: number,
    prevPage?: null | number,
    nextPage?: null | number,
    pagingCounter?: number,
    [x: string]: T[] | number | boolean | null | undefined,
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


declare module "easy-mongoose-paginate" {
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
    interface EasyPaginateModel<T, TQueryHelpers = {}, TMethods = {}>
        extends Model<T, TQueryHelpers, TMethods> {
            paginateAggregate<T>(
                dbQuery: PipelineStage[],
                filter?: AggregateFilter
            ): Promise<IPaginationResult>;
            paginateQuery<T>(
                dbQuery: FilterQuery<T>,
                filter?: QueryFilter
            ): Promise<IPaginationResult>;
    }
}