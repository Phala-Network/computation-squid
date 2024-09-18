module.exports = class Data1726654340980 {
    name = 'Data1726654340980'

    async up(db) {
        await db.query(`ALTER TABLE "global_state" ADD "idle_worker_p_init" integer NOT NULL DEFAULT 0`)
        await db.query(`ALTER TABLE "global_state" ADD "idle_worker_p_instant" integer NOT NULL DEFAULT 0`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "global_state" DROP COLUMN "idle_worker_p_init"`)
        await db.query(`ALTER TABLE "global_state" DROP COLUMN "idle_worker_p_instant"`)
    }
}
