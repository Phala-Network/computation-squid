module.exports = class Data1713872043029 {
    name = 'Data1713872043029'

    async up(db) {
        await db.query(`ALTER TABLE "global_state" ADD "tokenomic_updated_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "global_state" DROP COLUMN "tokenomic_updated_time"`)
    }
}
