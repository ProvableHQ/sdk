import { getNitroClassNetworkAware } from "./current-network";
import type { Metadata as MetadataNitro, MetadataObject } from "./specs/metadata.nitro";

const createNitro = (): MetadataNitro => getNitroClassNetworkAware<MetadataNitro>("Metadata");

export class Metadata {
  static bond_public(): MetadataObject {
    return createNitro().bond_public();
  }
  static bond_validator(): MetadataObject {
    return createNitro().bond_validator();
  }
  static claim_unbond_public(): MetadataObject {
    return createNitro().claim_unbond_public();
  }
  static fee_private(): MetadataObject {
    return createNitro().fee_private();
  }
  static fee_public(): MetadataObject {
    return createNitro().fee_public();
  }
  static inclusion(): MetadataObject {
    return createNitro().inclusion();
  }
  static join(): MetadataObject {
    return createNitro().join();
  }
  static set_validator_state(): MetadataObject {
    return createNitro().set_validator_state();
  }
  static split(): MetadataObject {
    return createNitro().split();
  }
  static transfer_private(): MetadataObject {
    return createNitro().transfer_private();
  }
  static transfer_private_to_public(): MetadataObject {
    return createNitro().transfer_private_to_public();
  }
  static transfer_public(): MetadataObject {
    return createNitro().transfer_public();
  }
  static transfer_public_as_signer(): MetadataObject {
    return createNitro().transfer_public_as_signer();
  }
  static transfer_public_to_private(): MetadataObject {
    return createNitro().transfer_public_to_private();
  }
  static unbond_public(): MetadataObject {
    return createNitro().unbond_public();
  }
}
