Skeleton contract for Emoducks.

Emoduck features are separated out into immutable ("baby") and mutable ("mania" and "sadness") features.  Only one feature -- either "mania" or "sadness" can be mutated for each mutate function call and each Emoduck has a maximum of 5 mutations. 

Currently, mutatable traits will be public for both private and public Emoducks.  For private Emoducks, only the owner will be able to link the public mutatable data with the hidden data.

The commit hash for an Emoduck serves as its public ID and is determined using only the immatable data.

To be continued...