module.exports = class Data1698739512260 {
    name = 'Data1698739512260'

    async up(db) {
        await db.query(`ALTER TABLE "account" ADD "identity_judgements" character varying(10) array`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "account" DROP COLUMN "identity_judgements"`)
    }
}
