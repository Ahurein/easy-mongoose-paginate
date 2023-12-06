"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const paginate_1 = __importStar(require("../src/paginate"));
(0, mongoose_1.connect)("mongodb://localhost:27017/mongoose-simple-paginate").then(() => console.log("database connected"));
const UserSchema = new mongoose_1.Schema({
    email: String,
    userVerified: Boolean,
});
const ProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Types.ObjectId,
        ref: "user"
    },
    firstName: String,
    lastName: String
});
UserSchema.plugin(paginate_1.default);
ProfileSchema.plugin(paginate_1.default);
const userModel = (0, mongoose_1.model)("user", UserSchema);
const profileModel = (0, mongoose_1.model)("profile", ProfileSchema);
describe("Mongoose simple pagination tests", () => {
    beforeAll(async () => {
        const userExist = await userModel.findOne();
        if (!userExist) {
            const userOne = await userModel.create({ email: "a@gmail.com", userVerified: true });
            const userTwo = await userModel.create({ email: "b@gmail.com", userVerified: true });
            const userThree = await userModel.create({ email: "c@gmail.com", userVerified: false });
            await profileModel.create({
                userId: userOne._id,
                firstName: "Michel",
                lastName: "Smith"
            });
            await profileModel.create({
                userId: userTwo._id,
                firstName: "Rachel",
                lastName: "Poulin"
            });
            await profileModel.create({
                userId: userThree._id,
                firstName: "Ronald",
                lastName: "Gullet"
            });
        }
    });
    describe("Test query paginate", () => {
        it("Select: returns only selected fields", async () => {
            const user = await userModel.paginateQuery({ email: "a@gmail.com" }, {
                select: "email", collation: {
                    locale: 'en'
                }
            });
            expect(user.docs[0].email).toEqual("a@gmail.com");
            expect(user.totalDocs).toEqual(1);
            expect(user.totalPages).toEqual(1);
        });
        it("Limit & Page: Limit number of elements", async () => {
            const user = await userModel.paginateQuery({}, { limit: 2, page: 1 });
            expect(user.docs.length).toEqual(2);
            expect(user.totalPages).toEqual(2);
            expect(user.hasNextPage).toEqual(true);
        });
        it("Sort: Sort the elements in descending", async () => {
            const user = await userModel.paginateQuery({}, { sort: { email: "desc" } });
            expect(user.docs[0].email).toEqual("c@gmail.com");
        });
        it("Populate: Include related", async () => {
            const user = await profileModel.paginateQuery({}, { sort: { email: "desc" }, populate: "userId" });
            expect(user.docs[0].userId).toBeInstanceOf(Object);
        });
        it("Config: Set global config", async () => {
            paginate_1.easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 };
            const user = await profileModel.paginateQuery({}, { sort: { email: "desc" }, populate: "userId" });
            expect(user.limit).toEqual(1);
            paginate_1.easyMongoosePaginateConfig.globalOptions = {};
        });
        it("Config: Get global config set", async () => {
            paginate_1.easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 };
            const globalOptions = paginate_1.easyMongoosePaginateConfig.getOptions();
            expect(globalOptions.limit).toEqual(1);
            expect(globalOptions.lean).toEqual(true);
            paginate_1.easyMongoosePaginateConfig.globalOptions = {};
        });
        it("Remove fields from return results", async () => {
            const user = await profileModel.paginateQuery({}, { sort: { email: "desc" }, populate: "userId", labels: { page: "false", docs: "false" } });
            expect(user).not.toContain(user.docs);
            expect(user).not.toContain(user.page);
        });
    });
    describe("Test aggregate paginate", () => {
        it("Select: returns only selected fields", async () => {
            const user = await userModel.paginateAggregate([], { project: { "email": 1 } });
            expect(user.docs[0].email).toEqual("a@gmail.com");
            expect(user.totalDocs).toEqual(3);
            expect(user.totalPages).toEqual(1);
        });
        it("Limit & Page: Limit number of elements", async () => {
            const user = await userModel.paginateAggregate([], { limit: 2, page: 1 });
            expect(user.docs.length).toEqual(2);
            expect(user.totalPages).toEqual(2);
            expect(user.hasNextPage).toEqual(true);
        });
        it("Sort: Sort the elements in descending", async () => {
            const user = await userModel.paginateAggregate([], { sort: { email: "desc" } });
            expect(user.docs[0].email).toEqual("c@gmail.com");
        });
        it("Populate: Include related", async () => {
            const user = await userModel.paginateAggregate([], { sort: { email: "desc" }, lookup: { from: "profiles", localField: "_id", foreignField: "userId", as: "userId" } });
            expect(user.docs[0].userId.length).toBeGreaterThanOrEqual(1);
        });
        it("Config: Set global config", async () => {
            paginate_1.easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 };
            const user = await profileModel.paginateAggregate([], { sort: { email: "desc" } });
            expect(user.limit).toEqual(1);
            paginate_1.easyMongoosePaginateConfig.globalOptions = {};
        });
        it("Config: Get global config set", async () => {
            paginate_1.easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 };
            const globalOptions = paginate_1.easyMongoosePaginateConfig.getOptions();
            expect(globalOptions.limit).toEqual(1);
            expect(globalOptions.lean).toEqual(true);
            paginate_1.easyMongoosePaginateConfig.globalOptions = {};
        });
        it("Remove fields from return results", async () => {
            const user = await profileModel.paginateAggregate([], { sort: { email: "desc" }, labels: { page: "false", docs: "false" } });
            expect(user).not.toContain(user.docs);
            expect(user).not.toContain(user.page);
        });
    });
    afterAll(async () => {
        profileModel.deleteMany();
        userModel.deleteMany();
        await mongoose_1.connection.close();
    });
});
