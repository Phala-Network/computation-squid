module.exports = class Data1700214726042 {
    name = 'Data1700214726042'

    async up(db) {
        await db.query(`ALTER TABLE "global_state" ADD "withdrawal_dust_cleared" boolean`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "global_state" DROP COLUMN "withdrawal_dust_cleared"`)
    }
}
