import { Hono } from 'hono';
import { isDid } from './did';
import { getOrRefetchBlob } from './blob';

const app = new Hono<{ Bindings: Env }>();

app.get(`/:did/:blobRef/:type?`, async ctx => {
	const { did, blobRef, type } = ctx.req.param();
	if (!isDid(did)) {
		ctx.status(400);
		return ctx.text('Invalid DID');
	}

	let format: RequestInitCfPropertiesImage['format'] = 'jpeg';
	if (type && ["json", "avif", "webp", "jpeg", "png"].includes(type)) {
		format = type as RequestInitCfPropertiesImage['format'];
	}

	const blob = await getOrRefetchBlob(ctx.env.atpcdn_dev, did, blobRef, {
		image: { format },
	})!;

	ctx.header('Content-Type', `image/${format}`);
	return ctx.body(await blob.arrayBuffer());
});

export default app satisfies ExportedHandler<Env>;
