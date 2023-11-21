import { PopulateOptions } from "mongoose";

export type queryPopulateType = PopulateOptions | (string | PopulateOptions)[]

interface IAggregateLookup {
    from: string,
    localField: string,
    foreignField: string,
    as: string
}

export interface ILabels {
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
    sort?: string | {[key: string]: any} ;
    labels?: ILabels
}

export class QueryFilter extends CommonFilter {
    select?: string | string[] | {[key: string]: number}; 
    populate?: string | string[];
    lean?: boolean;
}

export class AggregateFilter extends CommonFilter{
    project?: {[key: string]: any};
    lookup?: IAggregateLookup;
}

export interface IPaginationResult { 
    [x: string]: any; 
}