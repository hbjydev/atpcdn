import { simpleFetchHandler, XRPC } from "@atcute/client";
import { DID, getPdsUrl } from "./did";

const path = (did: DID, cid: string, format: string) => `${did}/${cid}/${format}`;

export const getOrRefetchBlob = async (
	bucket: R2Bucket,
	did: DID,
	cid: string,
	cf: RequestInitCfProperties,
) => {
	const existing = await bucket.get(path(did, cid, cf.image?.format!));
	if (existing) {
		console.log('Existing object exists, serving.');
		const data = await existing.blob();
		return data;
	}
	console.log('No existing object exists, ingesting.');

	const pdsUrl = await getPdsUrl(did as DID);
	if (!pdsUrl) {
		throw new Error('No PDS for given DID.');
	}

	const rpc = new XRPC({
		handler: simpleFetchHandler({
			service: pdsUrl,
			fetch: (input, init) => {
				return fetch(input, {
					...init,
					cf,
				});
			},
		})
	});
	const blob = await rpc.get('com.atproto.sync.getBlob', {
		params: {
			did: did as `did:${string}`,
			cid: cid,
		},
	});

	await bucket.put(path(did, cid, cf.image?.format!), blob.data);
	const data = new Blob([blob.data]);
	return data;
};
