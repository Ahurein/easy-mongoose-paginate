import { Aggregate, FilterQuery, HydratedDocument, LeanDocument, Model, PaginateOptions, PipelineStage, Query } from "mongoose";

declare module 'mongoose' {
    interface ILabels<T = string> {
        totalDocs?: T;
        docs?: T;
        limit?: T;
        page?: T;
        nextPage?: T;
        prevPage?: T;
        hasNextPage?: T;
        hasPrevPage?: T;
        totalPages?: T;
        pagingCounter?: T;
    }

    interface PaginateOptions {
        select?: string | string[] | { [key: string]: number };
        collation?: {
            locale: string;
            [key: string]: any
        } | undefined;
        sort?: string | { [key: string]: any };
        populate?: string | string[];
        lean?: boolean;
        page?: number;
        limit?: number;
        labels?: ILabels;
        project?: { [key: string]: any };
        allowDiskUse?: boolean;
        lookup?: IAggregateLookup;
    }

    class CommonFilter {
        page?: number;
        limit?: number;
        sort?: string | { [key: string]: any };
        labels?: ILabels;
        collation?: {
            locale: string;
            [key: string]: any
        } | undefined;
        allowDiskUse?: boolean
    }

    class QueryFilter extends CommonFilter {
        select?: string | string[] | { [key: string]: number };
        populate?: string | string[];
        lean?: boolean;
    }

    class AggregateFilter extends CommonFilter {
        project?: { [key: string]: any };
        lookup?: IAggregateLookup;
    }

    interface IPaginateResult<T> {
        docs?: T[];
        totalDocs?: number;
        limit?: number;
        hasPrevPage?: boolean;
        hasNextPage?: boolean;
        page?: number | undefined;
        totalPages?: number;
        prevPage?: number | null;
        nextPage?: number | null;
        pagingCounter?: number;
        [labels: string]: T[] | number | boolean | null | undefined;
    }

    interface IEasyMongoosePaginateConfig {
        globalOptions: PaginateOptions;
        getOptions?(): PaginateOptions
    }

    type PaginateDocument<
        T,
        TMethods,
        TVirtuals,
        O extends PaginateOptions = {}
    > = O['lean'] extends true
        ? O['leanWithId'] extends true
        ? LeanDocument<T & { id: string }>
        : LeanDocument<T>
        : HydratedDocument<T, TMethods, TVirtuals>;

    interface EasyPaginateModel<T, TQueryHelpers = {}, TMethods = {}>
        extends Model<T, TQueryHelpers, TMethods> {
        paginateAggregate<O extends PaginateOptions>(
            stage: PipelineStage[],
            filter?: AggregateFilter
        ): Promise<PaginateResult<PaginateDocument<T, TMethods, O>>>;
        paginateQuery<O extends PaginateOptions>(
            filterQuery: FilterQuery<T>,
            filter?: QueryFilter
        ): Promise<PaginateResult<PaginateDocument<T, TMethods, O>>>;
    }

    interface EasyPaginateModel<T, TQueryHelpers = {}, TMethods = {}>
        extends Model<T, TQueryHelpers, TMethods> {
        paginateAggregate<UserType = T, O extends PaginateOptions = PaginateOptions>(
            stage: PipelineStage[],
            filter?: AggregateFilter
        ): Promise<PaginateResult<PaginateDocument<UserType, TMethods, O>>>;
        paginateQuery<UserType = T, O extends PaginateOptions = PaginateOptions>(
            filterQuery: FilterQuery<T>,
            filter?: QueryFilter
        ): Promise<PaginateResult<PaginateDocument<UserType, TMethods, O>>>;
    }

    interface EasyPaginateModel<T, TQueryHelpers = {}, TMethods = {}>
        extends Model<T, TQueryHelpers, TMethods> {
        paginateAggregate<UserType = T>(
            stage: PipelineStage[],
            filter?: AggregateFilter
        ): Promise<PaginateResult<PaginateDocument<UserType, TMethods, PaginateOptions>>>;
        paginateQuery<UserType = T>(
            filterQuery: FilterQuery<T>,
            filter?: QueryFilter
        ): Promise<PaginateResult<PaginateDocument<UserType, TMethods, PaginateOptions>>>;
    }
}

declare function _(schema: mongoose.Schema): void;
export = _;
declare namespace _ {
    const easyMongoosePaginateConfig: { globalOptions: PaginateOptions, getOptions: () => PaginateOptions };
}
