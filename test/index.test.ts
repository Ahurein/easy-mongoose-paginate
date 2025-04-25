import { Schema, model, connect, Types, Document, EasyPaginateModel, connection } from 'mongoose'
import easyMongoosePaginate, { easyMongoosePaginateConfig } from '../src/paginate';
connect("mongodb://localhost:27017/mongoose-simple-paginate").then(() => console.log("database connected"))
// mongoose.set("debug", true)

interface IUser {
    email: string,
    userVerified: boolean
}
interface IProfile {
    userId: string,
    firstName: string,
    lastName: string
}

interface UserDocument extends Document, IUser { }
interface ProfileDocument extends Document, IProfile { }


const UserSchema = new Schema({
    email: String,
    userVerified: Boolean,
})

const ProfileSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "user"
    },
    firstName: String,
    lastName: String
})

UserSchema.plugin(easyMongoosePaginate)
ProfileSchema.plugin(easyMongoosePaginate);

const userModel = model<UserDocument, EasyPaginateModel<UserDocument>>("user", UserSchema);
const profileModel = model<UserDocument, EasyPaginateModel<ProfileDocument>>("profile", ProfileSchema)

describe("Mongoose simple pagination tests", () => {
    beforeAll(async () => {
        const userExist = await userModel.findOne()
        if (!userExist) {
            const userOne = await userModel.create({ email: "a@gmail.com", userVerified: true })
            const userTwo = await userModel.create({ email: "b@gmail.com", userVerified: true })
            const userThree = await userModel.create({ email: "c@gmail.com", userVerified: false })

            await profileModel.create({
                userId: userOne._id,
                firstName: "Michel",
                lastName: "Smith"
            })
            await profileModel.create({
                userId: userTwo._id,
                firstName: "Rachel",
                lastName: "Poulin"
            })
            await profileModel.create({
                userId: userThree._id,
                firstName: "Ronald",
                lastName: "Gullet"
            })
        }
    })

    describe("Test query paginate", () => {
        it("Select: returns only selected fields", async () => {
            const user = await userModel.paginateQuery({ email: "a@gmail.com" }, {
                select: "email", collation: {
                    locale: 'en'
                }
            })
            expect(user.docs[0].email).toEqual("a@gmail.com")
            expect(user.totalDocs).toEqual(1)
            expect(user.totalPages).toEqual(1)
        })

        it("Limit & Page: Limit number of elements", async () => {
            const user = await userModel.paginateQuery({}, { limit: 2, page: 1 })
            expect(user.docs.length).toEqual(2)
            expect(user.totalPages).toEqual(2)
            expect(user.hasNextPage).toEqual(true)
        })

        it("Sort: Sort the elements in descending", async () => {
            const user = await userModel.paginateQuery<UserDocument>({}, { sort: { email: "desc" } })
            expect(user.docs[0].email).toEqual("c@gmail.com")
        })

        it("Populate: Include related", async () => {
            const user = await profileModel.paginateQuery<ProfileDocument>({}, { sort: { email: "desc" }, populate: "userId" })
            expect(user.docs[0].userId).toBeInstanceOf(Object)
        })

        it("Config: Set global config", async () => {
            easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 }
            const user = await profileModel.paginateQuery<ProfileDocument>({}, { sort: { email: "desc" }, populate: "userId" })
            expect(user.limit).toEqual(1)
            easyMongoosePaginateConfig.globalOptions = {}
        })

        it("Config: Get global config set", async () => {
            easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 }
            const globalOptions = easyMongoosePaginateConfig.getOptions()
            expect(globalOptions.limit).toEqual(1)
            expect(globalOptions.lean).toEqual(true)
            easyMongoosePaginateConfig.globalOptions = {}
        })
        it("Remove fields from return results", async () => {
            const user = await profileModel.paginateQuery<ProfileDocument>({}, { sort: { email: "desc" }, populate: "userId", labels: {page: "false", docs: "false"} })
            expect(user).not.toContain(user.docs)
            expect(user).not.toContain(user.page)
        })
    })

    describe("Test aggregate paginate", () => {
        it("Select: returns only selected fields", async () => {
            const user = await userModel.paginateAggregate<UserDocument>([], { project: { "email": 1 } })
            expect(user.docs[0].email).toEqual("a@gmail.com")
            expect(user.totalDocs).toEqual(3)
            expect(user.totalPages).toEqual(1)
        })

        it("Limit & Page: Limit number of elements", async () => {
            const user = await userModel.paginateAggregate([], { limit: 2, page: 1 })
            expect(user.docs.length).toEqual(2)
            expect(user.totalPages).toEqual(2)
            expect(user.hasNextPage).toEqual(true)
        })

        it("Sort: Sort the elements in descending", async () => {
            const user = await userModel.paginateAggregate<UserDocument>([], { sort: { email: "desc" } })
            expect(user.docs[0].email).toEqual("c@gmail.com")
        })

        it("Populate: Include related", async () => {
            const user: any = await userModel.paginateAggregate<UserDocument>([], { sort: { email: "desc" }, lookup: { from: "profiles", localField: "_id", foreignField: "userId", as: "userId" } })
            expect(user.docs[0].userId.length).toBeGreaterThanOrEqual(1)
        })

        it("Config: Set global config", async () => {
            easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 }
            const user = await profileModel.paginateAggregate<ProfileDocument>([], { sort: { email: "desc" } })
            expect(user.limit).toEqual(1)
            easyMongoosePaginateConfig.globalOptions = {}
        })

        it("Config: Get global config set", async () => {
            easyMongoosePaginateConfig.globalOptions = { lean: true, limit: 1 }
            const globalOptions = easyMongoosePaginateConfig.getOptions()
            expect(globalOptions.limit).toEqual(1)
            expect(globalOptions.lean).toEqual(true)
            easyMongoosePaginateConfig.globalOptions = {}
        })

        it("Remove fields from return results", async () => {
            const user = await profileModel.paginateAggregate<ProfileDocument>([], { sort: { email: "desc" }, labels: {page: "false", docs: "false"} })
            expect(user).not.toContain(user.docs)
            expect(user).not.toContain(user.page)
        })
    })

    afterAll(async () => {
        profileModel.deleteMany()
        userModel.deleteMany()
        await connection.close()
    })
})