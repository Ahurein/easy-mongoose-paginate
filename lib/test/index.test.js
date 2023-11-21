"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const paginate_1 = require("../src/paginate");
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
UserSchema.plugin(paginate_1.paginatePlugin);
ProfileSchema.plugin(paginate_1.paginatePlugin);
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
            const userQuery = userModel.find({ email: "a@gmail.com" });
            const user = await paginate_1.paginate.paginateQuery(userQuery, { select: "email" });
            expect(user.docs[0].email).toEqual("a@gmail.com");
            expect(user.totalDocs).toEqual(1);
            expect(user.totalPages).toEqual(1);
        });
        it("Limit & Page: Limit number of elements", async () => {
            const userQuery = userModel.find();
            const user = await paginate_1.paginate.paginateQuery(userQuery, { limit: 2, page: 1 });
            expect(user.docs.length).toEqual(2);
            expect(user.totalPages).toEqual(2);
            expect(user.hasNextPage).toEqual(true);
        });
        it("Sort: Sort the elements in descending", async () => {
            const userQuery = userModel.find();
            const user = await paginate_1.paginate.paginateQuery(userQuery, { sort: { email: "desc" } });
            expect(user.docs[0].email).toEqual("c@gmail.com");
        });
        it("Populate: Include related", async () => {
            const userQuery = profileModel.find();
            const user = await paginate_1.paginate.paginateQuery(userQuery, { sort: { email: "desc" }, populate: "userId" });
            expect(user.docs[0].userId).toBeInstanceOf(Object);
        });
    });
    describe("Test aggregate paginate", () => {
        it("Select: returns only selected fields", async () => {
            const userQuery = userModel.aggregate();
            const user = await paginate_1.paginate.paginateAggregate(userQuery, userModel, { project: { "email": 1 } });
            expect(user.docs[0].email).toEqual("a@gmail.com");
            expect(user.totalDocs).toEqual(3);
            expect(user.totalPages).toEqual(1);
        });
        it("Limit & Page: Limit number of elements", async () => {
            const userQuery = userModel.aggregate();
            const user = await paginate_1.paginate.paginateAggregate(userQuery, userModel, { limit: 2, page: 1 });
            expect(user.docs.length).toEqual(2);
            expect(user.totalPages).toEqual(2);
            expect(user.hasNextPage).toEqual(true);
        });
        it("Sort: Sort the elements in descending", async () => {
            const userQuery = userModel.aggregate();
            const user = await paginate_1.paginate.paginateAggregate(userQuery, userModel, { sort: { email: "desc" } });
            expect(user.docs[0].email).toEqual("c@gmail.com");
        });
        it("Populate: Include related", async () => {
            const profileQuery = userModel.aggregate();
            const user = await paginate_1.paginate.paginateAggregate(profileQuery, userModel, { sort: { email: "desc" }, lookup: { from: "profiles", localField: "_id", foreignField: "userId", as: "userId" } });
            expect(user.docs[0].userId.length).toBeGreaterThanOrEqual(1);
        });
    });
    afterAll(async () => {
        profileModel.deleteMany();
        userModel.deleteMany();
        await mongoose_1.connection.close();
    });
});
