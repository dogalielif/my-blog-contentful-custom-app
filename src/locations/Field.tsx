import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Stack, Autocomplete } from '@contentful/f36-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { createClient } from 'contentful-management';


const cma = (sdk: FieldExtensionSDK) => createClient(
  { apiAdapter: sdk.cmaAdapter },
  {
    type: 'plain',
    defaults: {
      environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
      spaceId: sdk.ids.space,
    },
  }
)

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const locale = sdk.field.locale;
  const [selectedMainCategory, setSelectedMainCategory] = useState<any>(null); 
  const [subCategoryOptions, setsubCategoryOptions] = useState<any>(null); 
  const initialSubCategory = sdk.field.getValue()
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(initialSubCategory);
  const cmaClient = useMemo(() => cma(sdk), [sdk]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getEntryById = async (id: string) => {
    const entry = await cmaClient.entry.get({entryId: id}); 
    return entry;
  }

  const getSelectedMainCategoryDetails = async () => {
    const mainCategory = await getEntryById(selectedMainCategory);
    const subCategoryDetails = mainCategory.fields.subCategories?.[locale].length > 0 ? await Promise.all(mainCategory.fields.subCategories?.[locale].map(async (subCategory: any) => {
      const subCategoryDetails = await getEntryById(subCategory.sys.id);
      return subCategoryDetails;
    })) : [];
    setsubCategoryOptions(subCategoryDetails.length > 0 ? [...subCategoryDetails] : []);
    setIsLoading(false);
  }

  sdk.entry.fields['mainCategory'].onValueChanged((value) => {
    if(!value && selectedMainCategory) {
      setSelectedMainCategory(null);
      setSelectedSubCategory(null);
      return;
    }
    if(value && value?.sys?.id !== selectedMainCategory) {
      setIsLoading(true);
      setSelectedMainCategory(value.sys.id);
    }
  })

  useEffect(() => {
    if(selectedMainCategory) {
      getSelectedMainCategoryDetails();
    } else {
      setsubCategoryOptions(null);
      setIsLoading(false);
    }
  }, [selectedMainCategory])

  useEffect(() => {
    if(!isLoading) {
      const currentValue = sdk.field.getValue();
      if(!subCategoryOptions || subCategoryOptions.length === 0) {
        setSelectedSubCategory(null);
      } else {
        const currentValueOption = subCategoryOptions.filter((item: any) => {
          return item.sys.id === currentValue
        });
        if (!currentValueOption.length) { 
          setSelectedSubCategory(null)
        } else {
          setSelectedSubCategory(currentValue);
        }
      }
    }
  }, [isLoading, subCategoryOptions, sdk])

  // const setFieldValue = async () => {
  //   await ;
  // }; 

  useEffect(() => {
    sdk.field.setValue(selectedSubCategory);
  }, [selectedSubCategory])

  const onSubCategorySelection = (e: any) => {
    if(selectedSubCategory === e.target.value) {
      setSelectedSubCategory(null);
      return;
    }
    setSelectedSubCategory(e.target.value)
  };

  if(isLoading) {
    return (<div>Loading Data...</div>)
  }

  return (
    <>
      {!isLoading && !subCategoryOptions && (<div>{'Please Select Main Category'}</div>)}
      {!isLoading && subCategoryOptions && subCategoryOptions.length === 0 && (<div>{'The selected Main Category does not contain any sub category'}</div>)}
      {
        !isLoading && subCategoryOptions && subCategoryOptions.length > 0 && (
          <Stack flexDirection="row">
           {subCategoryOptions.map((item: any) => {
              return (
                <Checkbox
                  key={item.sys.id}
                  id="radio1"
                  name="radio-uncontrolled"
                  value={item.sys.id}
                  isChecked={selectedSubCategory === item.sys.id}
                  isDisabled={isLoading}
                  onChange={onSubCategorySelection}
                >
                  {item.fields.navbarTitle?.[locale]}
                </Checkbox>
              )
            })}
        </Stack>
        )
      }
    </>)
    // <div>
    //   {isLoading && <div>Loading...</div>}
    //   <div style={{marginBottom: '1rem'}}>
    //   {mainCategoryItems.length > 0 && (
    //     <Select
    //       styles={{
    //       control: (baseStyles, state) => ({
    //         ...baseStyles,
    //         borderColor: state.isFocused ? 'blue' : 'auto',
    //       }),
    //     }}
    //       onChange={handleSelectMainMenu}
    //       options={mainCategoryItems}
    //       isDisabled={isLoading}
    //     />
    //   )}
    //   </div>
    //   {selectedMainMenu && subMenuItems.length > 0 && (
    //     <Stack flexDirection="row">
    //       {subMenuItems.map((item: any) => {
    //         return (
    //           <Checkbox
    //             id="radio1"
    //             name="radio-uncontrolled"
    //             value={item.id}
    //             isChecked={selectedSubMenu === item.id}
    //             isDisabled={isLoading}
    //             onChange={onSubCategorySelection}
    //             defaultChecked={false}
    //           >
    //             {item.title}
    //           </Checkbox>
    //         )
    //       })}
    //     </Stack>)
    //   }
    // </div>
};

export default Field;
