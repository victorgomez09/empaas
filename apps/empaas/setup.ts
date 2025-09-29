import { execAsync } from "@empaas/server";
import { setupDirectories } from "@empaas/server/setup/config-paths";
import { initializePostgres } from "@empaas/server/setup/postgres-setup";
import { initializeRedis } from "@empaas/server/setup/redis-setup";
import { initializeNetwork, initializeSwarm } from "@empaas/server/setup/setup";
import {
	createDefaultMiddlewares,
	createDefaultServerTraefikConfig,
	createDefaultTraefikConfig,
	initializeStandaloneTraefik,
} from "@empaas/server/setup/traefik-setup";

(async () => {
	try {
		setupDirectories();
		createDefaultMiddlewares();
		await initializeSwarm();
		await initializeNetwork();
		createDefaultTraefikConfig();
		createDefaultServerTraefikConfig();
		await execAsync("docker pull traefik:v3.5.0");
		await initializeStandaloneTraefik();
		await initializeRedis();
		await initializePostgres();
	} catch (e) {
		console.error("Error in empaas-setup", e);
	}
})();
