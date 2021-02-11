declare class Konteiner {
    constructor(options?: Konteiner.KonteinerOptions);

    register<T>(dependencyCreator: Konteiner.DependencyCreator<T>, options?: Konteiner.RegisterOptions): void;
    registerPath(path: string, options?: Konteiner.RegisterPathOptions): void;
   
    get<T>(dependencyCreator: Konteiner.DependencyCreator<T>): T;
    getByTag(tagName: string): any[];

    remove<T>(dependencyCreator: Konteiner.DependencyCreator<T>): boolean;
    getDependencyMap(): Map<any, Konteiner.SimpleRef>;
}

declare namespace Konteiner {
    export type Factory<FnInstance> = (arg0: Konteiner) => void | FnInstance;
    export type Class<ClsInstance> = new (arg1: Konteiner) => ClsInstance;
    export type DependencyCreator<T> = Factory<T> | Class<T>;

    export interface KonteinerOptions {
        /**
         * .registerPath config - excludes files during  call by pattern
         */
        exclude?: Array<string> | undefined;
        /**
         * exclude alias
         */
        skipFiles?: Array<string> | undefined;
        /**
         * .registerPath config - how deep in subdirectories will Konteiner search for dependencies
         * 	1 = only current (default), -1 = all the way down
         */
        dirSearchDepth?: number | undefined;
        /**
         * .registerPath config
         * - when providing file name w/o extension, Konteiner will search for variant with provided extension
         * - default [".js"]
         */
        supportedExtensions?: Array<string> | undefined;
    }

    export interface RegisterOptions {
        tags?: Array<string> | undefined;
    }

    export interface RegisterPathOptions extends RegisterOptions {
        /**
         * excludes files during  call by pattern
         */
        exclude?: Array<string> | undefined;
        /**
         * exclude alias
         */
        skipFiles?: Array<string> | undefined;
        /**
         * how deep in subdirectories will Konteiner search for dependencies
         * 1 = only current (default), -1 = all the way down
         */
        dirSearchDepth?: number | undefined;
        /**
         * - when providing file name w/o extension, Konteiner will search for variant with provided extension
         * - default [".js"]
         */
        supportedExtensions?: Array<string> | undefined;
    }

    export interface SimpleRef {
        name: string;
        type: string;
        path: string;
        initialized: boolean;
        instance: any;
        dependencies: Array<SimpleRef>;
    }
}

export = Konteiner